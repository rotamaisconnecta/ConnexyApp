import {
  SCORING_WEIGHTS,
  type RecommendationScore,
} from "./engine-types";

export function calculateInterestScore(interests: string[], itemInterests: string[]): number {
  if (interests.length === 0 || itemInterests.length === 0) return 0;
  const userSet = new Set(interests.map((i) => i.toLowerCase()));
  const overlap = itemInterests.filter((i) => userSet.has(i.toLowerCase())).length;
  return Math.round((overlap / itemInterests.length) * 100);
}

export function calculateDistanceScore(distanceMeters: number, maxDistance = 5000): number {
  if (distanceMeters <= 0) return 100;
  if (distanceMeters >= maxDistance) return 0;
  return Math.round((1 - distanceMeters / maxDistance) * 100);
}

export function calculatePopularityScore(likes: number, views: number, maxLikes = 10000): number {
  if (views === 0) return 0;
  const ratio = Math.min(likes / views, 1);
  const popularityRatio = Math.min(likes / maxLikes, 1);
  return Math.round((ratio * 0.6 + popularityRatio * 0.4) * 100);
}

export function calculateCompatibilityScore(userInterests: string[], itemTags: string[]): number {
  if (userInterests.length === 0 || itemTags.length === 0) return 0;
  const userSet = new Set(userInterests.map((i) => i.toLowerCase()));
  const itemSet = new Set(itemTags.map((i) => i.toLowerCase()));
  let matches = 0;
  for (const tag of itemSet) {
    if (userSet.has(tag)) matches++;
  }
  const union = new Set([...userSet, ...itemSet]);
  return Math.round((matches / union.size) * 100);
}

export function calculateTimeScore(hour: number): number {
  const activityPatterns: Record<number, number> = {
    0: 15, 1: 10, 2: 5, 3: 5, 4: 5, 5: 10,
    6: 30, 7: 50, 8: 70, 9: 85, 10: 90, 11: 85,
    12: 80, 13: 75, 14: 80, 15: 85, 16: 80, 17: 75,
    18: 80, 19: 85, 20: 90, 21: 95, 22: 85, 23: 60,
  };
  return activityPatterns[hour] ?? 50;
}

export function calculateRecencyScore(createdAt: string, maxAgeDays = 7): number {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const ageMs = now - created;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  if (ageMs <= 0) return 100;
  if (ageMs >= maxAgeMs) return 0;
  return Math.round((1 - ageMs / maxAgeMs) * 100);
}

export function calculateFinalScore(scores: {
  interest: number;
  distance: number;
  popularity: number;
  compatibility: number;
  time: number;
  recency: number;
}): RecommendationScore {
  const total = Math.round(
    scores.interest * SCORING_WEIGHTS.interest +
    scores.distance * SCORING_WEIGHTS.distance +
    scores.popularity * SCORING_WEIGHTS.popularity +
    scores.compatibility * SCORING_WEIGHTS.compatibility +
    scores.time * SCORING_WEIGHTS.time +
    scores.recency * SCORING_WEIGHTS.recency,
  );
  return {
    interest: scores.interest,
    distance: scores.distance,
    popularity: scores.popularity,
    compatibility: scores.compatibility,
    time: scores.time,
    recency: scores.recency,
    total: Math.min(Math.max(total, 0), 100),
  };
}
