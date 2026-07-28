/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Marketplace / Offers Ranking
   Ranks offers by discount, relevance, proximity.
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

/* ─── AIOffer ───────────────────────────────────────────── */

export interface AIOffer {
  id: string;
  title: string;
  description: string;
  businessId: string;
  businessName: string;
  discountPercent: number;
  validUntil: string;
  originalPrice: number;
  finalPrice: number;
  distance: number;
  tags: string[];
  popularity: number;
  isClaimed: boolean;
  createdAt: string;
}

/* ─── toEntity ──────────────────────────────────────────── */

function offerToEntity(offer: AIOffer): AIEntity {
  return {
    id: offer.id,
    type: "OFFER",
    distance: offer.distance,
    rating: 0,
    activity: offer.isClaimed ? 30 : 100,
    popularity: offer.popularity,
    createdAt: offer.createdAt,
    updatedAt: offer.createdAt,
    tags: offer.tags,
    interests: offer.tags,
    score: 0,
    priority: 0,
  };
}

/* ─── scoreOffer ────────────────────────────────────────── */

export function scoreOffer(offer: AIOffer, context: AIContextSignal, profile: AIProfile): AIScore {
  const distScore = scoreDistance(offer.distance, 5000);
  const interestScore = scoreInterest(profile.interests, offer.tags);
  const popScore = scorePopularity(offer.popularity, 200);
  const timeScore = scoreTime(new Date().getHours());
  const activityScore = scoreActivity(offer.createdAt, 72);

  let contextScore = 50;
  if (offer.validUntil) {
    const validUntil = new Date(offer.validUntil);
    const now = new Date();
    const daysUntil = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil >= 0 && daysUntil <= 3) contextScore += 20;
    else if (daysUntil > 3 && daysUntil <= 7) contextScore += 10;
    else if (daysUntil < 0) contextScore -= 40;
  }
  if (offer.discountPercent >= 30) contextScore += 15;
  else if (offer.discountPercent >= 15) contextScore += 8;
  if (context.hotArea) contextScore += 5;
  contextScore = clamp(contextScore);

  const discountScore = clamp(Math.round(offer.discountPercent));

  return calculateFinalScore(
    distScore,
    contextScore,
    interestScore,
    0,
    discountScore + popScore / 3,
    timeScore,
    activityScore,
  );
}

/* ─── rankOffers ────────────────────────────────────────── */

export function rankOffers(
  offers: AIOffer[],
  context: AIContextSignal,
  profile: AIProfile,
): AIEntity[] {
  const entities = offers.map((offer) => {
    const score = scoreOffer(offer, context, profile);
    return {
      ...offerToEntity(offer),
      score: score.finalScore,
      priority: score.finalScore,
    };
  });

  return sortByScore(deduplicate(entities));
}

/* ─── rankOffersWithScores ──────────────────────────────── */

export function rankOffersWithScores(
  offers: AIOffer[],
  context: AIContextSignal,
  profile: AIProfile,
): { items: AIEntity[]; scores: Map<string, AIScore> } {
  const scores = new Map<string, AIScore>();

  const entities = offers.map((offer) => {
    const score = scoreOffer(offer, context, profile);
    scores.set(offer.id, score);
    return {
      ...offerToEntity(offer),
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
