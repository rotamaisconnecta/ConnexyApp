/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Driver Ranking
   Ranks drivers by distance, time, price, rating.
   Pure TypeScript. No React. No side effects.
============================================================ */

import type { AIEntity, AIContextSignal, AIProfile, AIScore } from "./ai-types";
import { scoreDistance, scoreActivity, scoreTime, calculateFinalScore } from "./ai-score";
import { sortByScore, deduplicate } from "./ai-ranking";

/* ─── AIDriver ──────────────────────────────────────────── */

export interface AIDriver {
  id: string;
  name: string;
  photo: string;
  distance: number;
  rating: number;
  totalTrips: number;
  etaMinutes: number;
  priceEstimate: number;
  isAvailable: boolean;
  lastActiveAt: string;
  vehicle: string;
  plate: string;
}

/* ─── toEntity ──────────────────────────────────────────── */

function driverToEntity(driver: AIDriver): AIEntity {
  return {
    id: driver.id,
    type: "DRIVER",
    distance: driver.distance,
    rating: driver.rating,
    activity: driver.isAvailable ? 100 : 0,
    popularity: driver.totalTrips,
    createdAt: driver.lastActiveAt,
    updatedAt: driver.lastActiveAt,
    tags: [],
    interests: [],
    score: 0,
    priority: 0,
  };
}

/* ─── scoreDriver ───────────────────────────────────────── */

export function scoreDriver(
  driver: AIDriver,
  context: AIContextSignal,
  profile: AIProfile,
): AIScore {
  const distScore = scoreDistance(driver.distance, 5000);

  const availBonus = driver.isAvailable ? 20 : -20;
  const contextScore = clamp(
    50 + availBonus + (context.hotArea ? 15 : 0) + (context.nearDrivers > 0 ? 10 : 0),
  );

  const priceScore =
    driver.priceEstimate > 0 ? clamp(Math.round((1 - driver.priceEstimate / 100) * 100)) : 50;

  const ratingScore = clamp(Math.round((driver.rating / 5) * 100));

  const activityScore = scoreActivity(driver.lastActiveAt, 2);
  const timeScore = scoreTime(new Date().getHours());

  return calculateFinalScore(
    distScore,
    contextScore,
    priceScore,
    0,
    ratingScore,
    timeScore,
    activityScore,
  );
}

/* ─── rankDrivers ───────────────────────────────────────── */

export function rankDrivers(
  drivers: AIDriver[],
  context: AIContextSignal,
  profile: AIProfile,
): AIEntity[] {
  const entities = drivers.map((driver) => {
    const score = scoreDriver(driver, context, profile);
    return {
      ...driverToEntity(driver),
      score: score.finalScore,
      priority: score.finalScore,
    };
  });

  return sortByScore(deduplicate(entities));
}

/* ─── rankDriversWithScores ─────────────────────────────── */

export function rankDriversWithScores(
  drivers: AIDriver[],
  context: AIContextSignal,
  profile: AIProfile,
): { items: AIEntity[]; scores: Map<string, AIScore> } {
  const scores = new Map<string, AIScore>();

  const entities = drivers.map((driver) => {
    const score = scoreDriver(driver, context, profile);
    scores.set(driver.id, score);
    return {
      ...driverToEntity(driver),
      score: score.finalScore,
      priority: score.finalScore,
    };
  });

  return {
    items: sortByScore(deduplicate(entities)),
    scores,
  };
}

/* ─── Utilities ─────────────────────────────────────────── */

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}
