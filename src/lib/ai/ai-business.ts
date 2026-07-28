/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Business Ranking
   Ranks businesses by rating, distance, popularity, activity.
   Pure TypeScript. No React. No side effects.
============================================================ */

import type { AIEntity, AIContextSignal, AIProfile, AIScore } from "./ai-types";
import {
  scoreDistance,
  scoreInterest,
  scorePopularity,
  scoreTime,
  scoreActivity,
  calculateFinalScore,
} from "./ai-score";
import { sortByScore, deduplicate } from "./ai-ranking";

/* ─── AIBusiness ────────────────────────────────────────── */

export interface AIBusiness {
  id: string;
  name: string;
  category: string;
  distance: number;
  rating: number;
  reviewCount: number;
  offerCount: number;
  isFollowing: boolean;
  isOpen: boolean;
  tags: string[];
  popularity: number;
  lastActivityAt: string;
}

/* ─── toEntity ──────────────────────────────────────────── */

function businessToEntity(business: AIBusiness): AIEntity {
  return {
    id: business.id,
    type: "BUSINESS",
    distance: business.distance,
    rating: business.rating,
    activity: business.isOpen ? 100 : 30,
    popularity: business.popularity,
    createdAt: business.lastActivityAt,
    updatedAt: business.lastActivityAt,
    tags: business.tags,
    interests: business.tags,
    score: 0,
    priority: 0,
  };
}

/* ─── scoreBusiness ─────────────────────────────────────── */

export function scoreBusiness(
  business: AIBusiness,
  context: AIContextSignal,
  profile: AIProfile,
): AIScore {
  const distScore = scoreDistance(business.distance, 5000);
  const interestScore = scoreInterest(profile.interests, business.tags);
  const popScore = scorePopularity(business.popularity, 500);
  const timeScore = scoreTime(new Date().getHours());
  const activityScore = scoreActivity(business.lastActivityAt, 48);

  let contextScore = 50;
  if (business.isOpen) contextScore += 20;
  if (business.isFollowing) contextScore += 15;
  if (business.offerCount > 0) contextScore += 10;
  if (context.hotArea) contextScore += 5;
  contextScore = clamp(contextScore);

  const ratingScore = clamp(Math.round((business.rating / 5) * 100));

  return calculateFinalScore(
    distScore,
    contextScore,
    interestScore,
    0,
    ratingScore + popScore / 2,
    timeScore,
    activityScore,
  );
}

/* ─── rankBusinesses ────────────────────────────────────── */

export function rankBusinesses(
  businesses: AIBusiness[],
  context: AIContextSignal,
  profile: AIProfile,
): AIEntity[] {
  const entities = businesses.map((business) => {
    const score = scoreBusiness(business, context, profile);
    return {
      ...businessToEntity(business),
      score: score.finalScore,
      priority: score.finalScore,
    };
  });

  return sortByScore(deduplicate(entities));
}

/* ─── rankBusinessesWithScores ──────────────────────────── */

export function rankBusinessesWithScores(
  businesses: AIBusiness[],
  context: AIContextSignal,
  profile: AIProfile,
): { items: AIEntity[]; scores: Map<string, AIScore> } {
  const scores = new Map<string, AIScore>();

  const entities = businesses.map((business) => {
    const score = scoreBusiness(business, context, profile);
    scores.set(business.id, score);
    return {
      ...businessToEntity(business),
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
