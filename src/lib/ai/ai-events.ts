/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Events Ranking
   Ranks events by interests, popularity, distance, friends, time.
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

/* ─── AIEvent ───────────────────────────────────────────── */

export interface AIEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  banner: string;
  category: string;
  distance: number;
  interestedCount: number;
  attendingCount: number;
  friendsAttending: number;
  tags: string[];
  isInterested: boolean;
  isAttending: boolean;
  createdAt: string;
}

/* ─── toEntity ──────────────────────────────────────────── */

function eventToEntity(event: AIEvent): AIEntity {
  return {
    id: event.id,
    type: "EVENT",
    distance: event.distance,
    rating: 0,
    activity: event.attendingCount + event.interestedCount,
    popularity: event.attendingCount + event.interestedCount,
    createdAt: event.createdAt,
    updatedAt: event.createdAt,
    tags: event.tags,
    interests: event.tags,
    score: 0,
    priority: 0,
  };
}

/* ─── scoreEvent ────────────────────────────────────────── */

export function scoreEvent(event: AIEvent, context: AIContextSignal, profile: AIProfile): AIScore {
  const distScore = scoreDistance(event.distance, 10000);
  const interestScore = scoreInterest(profile.interests, event.tags);
  const popScore = scorePopularity(event.attendingCount + event.interestedCount, 500);
  const timeScore = scoreTime(new Date().getHours());
  const activityScore = scoreActivity(event.createdAt, 168);

  let contextScore = 50;
  if (event.date) {
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil >= 0 && daysUntil <= 3) contextScore += 20;
    else if (daysUntil > 3 && daysUntil <= 7) contextScore += 10;
    else if (daysUntil < 0) contextScore -= 30;
  }
  if (event.isInterested) contextScore += 15;
  if (event.isAttending) contextScore += 10;
  if (event.friendsAttending > 0) contextScore += event.friendsAttending * 5;
  if (context.hotArea) contextScore += 10;
  contextScore = clamp(contextScore);

  const friendScore = clamp(Math.round(event.friendsAttending * 20));

  return calculateFinalScore(
    distScore,
    contextScore,
    interestScore,
    friendScore,
    popScore,
    timeScore,
    activityScore,
  );
}

/* ─── rankEvents ────────────────────────────────────────── */

export function rankEvents(
  events: AIEvent[],
  context: AIContextSignal,
  profile: AIProfile,
): AIEntity[] {
  const entities = events.map((event) => {
    const score = scoreEvent(event, context, profile);
    return {
      ...eventToEntity(event),
      score: score.finalScore,
      priority: score.finalScore,
    };
  });

  return sortByScore(deduplicate(entities));
}

/* ─── rankEventsWithScores ──────────────────────────────── */

export function rankEventsWithScores(
  events: AIEvent[],
  context: AIContextSignal,
  profile: AIProfile,
): { items: AIEntity[]; scores: Map<string, AIScore> } {
  const scores = new Map<string, AIScore>();

  const entities = events.map((event) => {
    const score = scoreEvent(event, context, profile);
    scores.set(event.id, score);
    return {
      ...eventToEntity(event),
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
