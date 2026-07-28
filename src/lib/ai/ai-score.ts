/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Score
   7 scoring functions + final score calculator.
   All return 0-100.
   Pure TypeScript. No React. No side effects.
============================================================ */

import { AI_WEIGHTS, type AIScore, type AIContextSignal, type AIProfile } from "./ai-types";

/* ─── scoreDistance ─────────────────────────────────────── */

export function scoreDistance(distanceMeters: number, maxDistance = 5000): number {
  if (distanceMeters <= 0) return 100;
  if (distanceMeters >= maxDistance) return 0;
  return clamp(Math.round((1 - distanceMeters / maxDistance) * 100));
}

/* ─── scoreContext ──────────────────────────────────────── */

export function scoreContext(signal: AIContextSignal): number {
  let score = 50;

  if (signal.hotArea) score += 20;
  if (signal.nearEvents > 3) score += 15;
  else if (signal.nearEvents > 0) score += 8;
  if (signal.nearPeople > 5) score += 10;
  else if (signal.nearPeople > 0) score += 5;
  if (signal.nearBusinesses > 3) score += 5;

  if (signal.movement === "CROWDED") score += 10;
  else if (signal.movement === "BUSY") score += 5;
  else if (signal.movement === "CALM") score -= 5;

  if (signal.period === "EVENING" || signal.period === "NIGHT") score += 5;
  if (signal.period === "MORNING") score += 3;

  if (signal.weather === "SUNNY") score += 5;
  else if (signal.weather === "RAIN") score -= 5;

  return clamp(Math.round(score));
}

/* ─── scoreInterest ─────────────────────────────────────── */

export function scoreInterest(userInterests: string[], entityTags: string[]): number {
  if (userInterests.length === 0 || entityTags.length === 0) return 0;

  const userSet = new Set(userInterests.map((i) => i.toLowerCase()));
  const matches = entityTags.filter((t) => userSet.has(t.toLowerCase())).length;
  const union = new Set([
    ...userInterests.map((i) => i.toLowerCase()),
    ...entityTags.map((t) => t.toLowerCase()),
  ]);

  if (union.size === 0) return 0;
  return clamp(Math.round((matches / union.size) * 100));
}

/* ─── scoreHistory ──────────────────────────────────────── */

export function scoreHistory(
  entityId: string,
  historyMap: Map<string, number>,
  totalInteractions: number,
): number {
  if (totalInteractions === 0) return 0;

  const entityCount = historyMap.get(entityId) ?? 0;
  if (entityCount === 0) return 0;

  const frequency = Math.min(entityCount / totalInteractions, 1);
  return clamp(Math.round(frequency * 100));
}

/* ─── scorePopularity ───────────────────────────────────── */

export function scorePopularity(popularity: number, maxPopularity = 1000): number {
  if (popularity <= 0) return 0;
  return clamp(Math.round(Math.min(popularity / maxPopularity, 1) * 100));
}

/* ─── scoreTime ─────────────────────────────────────────── */

export function scoreTime(hour: number): number {
  const activityPatterns: Record<number, number> = {
    0: 15,
    1: 10,
    2: 5,
    3: 5,
    4: 5,
    5: 10,
    6: 30,
    7: 50,
    8: 70,
    9: 85,
    10: 90,
    11: 85,
    12: 80,
    13: 75,
    14: 80,
    15: 85,
    16: 80,
    17: 75,
    18: 80,
    19: 85,
    20: 90,
    21: 95,
    22: 85,
    23: 60,
  };
  return activityPatterns[hour] ?? 50;
}

/* ─── scoreActivity ─────────────────────────────────────── */

export function scoreActivity(lastActivityAt: string, maxAgeHours = 24): number {
  const now = Date.now();
  const lastActivity = new Date(lastActivityAt).getTime();
  const ageHours = (now - lastActivity) / (1000 * 60 * 60);

  if (ageHours <= 0) return 100;
  if (ageHours >= maxAgeHours) return 0;
  return clamp(Math.round((1 - ageHours / maxAgeHours) * 100));
}

/* ─── calculateFinalScore ───────────────────────────────── */

export function calculateFinalScore(
  distanceScore: number,
  contextScore: number,
  interestScore: number,
  historyScore: number,
  popularityScore: number,
  timeScore: number,
  activityScore: number,
): AIScore {
  const finalScore = Math.round(
    distanceScore * AI_WEIGHTS.distance +
      contextScore * AI_WEIGHTS.context +
      interestScore * AI_WEIGHTS.interest +
      historyScore * AI_WEIGHTS.history +
      popularityScore * AI_WEIGHTS.popularity +
      timeScore * AI_WEIGHTS.time +
      activityScore * AI_WEIGHTS.activity,
  );

  return {
    distanceScore,
    contextScore,
    interestScore,
    historyScore,
    popularityScore,
    timeScore,
    activityScore,
    finalScore: clamp(finalScore),
  };
}

/* ─── Utilities ─────────────────────────────────────────── */

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

/* ─── buildFullScore ────────────────────────────────────── */

export function buildFullScore(
  distance: number,
  context: AIContextSignal,
  userInterests: string[],
  entityTags: string[],
  entityId: string,
  historyMap: Map<string, number>,
  totalInteractions: number,
  popularity: number,
  maxPopularity: number,
  lastActivityAt: string,
  maxDistance?: number,
  maxAgeHours?: number,
): AIScore {
  return calculateFinalScore(
    scoreDistance(distance, maxDistance),
    scoreContext(context),
    scoreInterest(userInterests, entityTags),
    scoreHistory(entityId, historyMap, totalInteractions),
    scorePopularity(popularity, maxPopularity),
    scoreTime(new Date().getHours()),
    scoreActivity(lastActivityAt, maxAgeHours),
  );
}
