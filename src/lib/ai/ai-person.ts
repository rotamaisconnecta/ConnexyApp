/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — People Ranking
   Ranks people by interests, compatibility, networking, distance.
   Pure TypeScript. No React. No side effects.
============================================================ */

import type { AIEntity, AIContextSignal, AIProfile, AIScore } from "./ai-types";
import {
  scoreDistance,
  scoreInterest,
  scorePopularity,
  scoreTime,
  scoreActivity,
  scoreHistory,
  calculateFinalScore,
} from "./ai-score";
import { sortByScore, deduplicate } from "./ai-ranking";

/* ─── AIPerson ──────────────────────────────────────────── */

export interface AIPerson {
  id: string;
  name: string;
  handle: string;
  photo: string;
  age: number;
  profession: string | null;
  distance: number;
  compatibility: number;
  interests: string[];
  vibeTags: string[];
  isOnline: boolean;
  lastSeen: string | null;
  mutualConnections: number;
  lastActivityAt: string;
}

/* ─── toEntity ──────────────────────────────────────────── */

function personToEntity(person: AIPerson): AIEntity {
  return {
    id: person.id,
    type: "PERSON",
    distance: person.distance,
    rating: person.compatibility,
    activity: person.isOnline ? 100 : 20,
    popularity: person.mutualConnections,
    createdAt: person.lastActivityAt,
    updatedAt: person.lastActivityAt,
    tags: person.vibeTags,
    interests: person.interests,
    score: 0,
    priority: 0,
  };
}

/* ─── scorePerson ───────────────────────────────────────── */

export function scorePerson(
  person: AIPerson,
  context: AIContextSignal,
  profile: AIProfile,
  historyMap: Map<string, number>,
  totalInteractions: number,
): AIScore {
  const distScore = scoreDistance(person.distance, 10000);
  const interestScore = scoreInterest(profile.interests, person.interests);
  const compatScore = clamp(Math.round(person.compatibility));
  const popScore = scorePopularity(person.mutualConnections, 20);
  const timeScore = scoreTime(new Date().getHours());
  const activityScore = person.lastActivityAt
    ? scoreActivity(person.lastActivityAt, 48)
    : person.isOnline
      ? 80
      : 10;
  const histScore = scoreHistory(person.id, historyMap, totalInteractions);

  let contextScore = 50;
  if (person.isOnline) contextScore += 20;
  if (person.mutualConnections > 3) contextScore += 15;
  else if (person.mutualConnections > 0) contextScore += 8;
  if (context.hotArea && person.distance < 2000) contextScore += 10;
  if (context.nearPeople > 5) contextScore += 5;
  contextScore = clamp(contextScore);

  return calculateFinalScore(
    distScore,
    contextScore,
    interestScore,
    histScore,
    compatScore + popScore / 2,
    timeScore,
    activityScore,
  );
}

/* ─── rankPeople ────────────────────────────────────────── */

export function rankPeople(
  people: AIPerson[],
  context: AIContextSignal,
  profile: AIProfile,
  historyMap: Map<string, number>,
  totalInteractions: number,
): AIEntity[] {
  const entities = people.map((person) => {
    const score = scorePerson(person, context, profile, historyMap, totalInteractions);
    return {
      ...personToEntity(person),
      score: score.finalScore,
      priority: score.finalScore,
    };
  });

  return sortByScore(deduplicate(entities));
}

/* ─── rankPeopleWithScores ──────────────────────────────── */

export function rankPeopleWithScores(
  people: AIPerson[],
  context: AIContextSignal,
  profile: AIProfile,
  historyMap: Map<string, number>,
  totalInteractions: number,
): { items: AIEntity[]; scores: Map<string, AIScore> } {
  const scores = new Map<string, AIScore>();

  const entities = people.map((person) => {
    const score = scorePerson(person, context, profile, historyMap, totalInteractions);
    scores.set(person.id, score);
    return {
      ...personToEntity(person),
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
