/* =========================================================
   feed-ranking.ts — Pure ranking functions
   No React. No side effects. No Supabase.
========================================================= */

import type { FeedItem } from "./feed-types";

/* ─── sortByDistance ─────────────────────────────────────── */

export function sortByDistance(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => a.distance - b.distance);
}

/* ─── sortByRecent ───────────────────────────────────────── */

export function sortByRecent(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/* ─── sortByCompatibility ────────────────────────────────── */

export function sortByCompatibility(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => b.priority - a.priority);
}

/* ─── sortByPopularity ───────────────────────────────────── */

export function sortByPopularity(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const scoreA = getPopularityScore(a);
    const scoreB = getPopularityScore(b);
    return scoreB - scoreA;
  });
}

/* ─── sortSmart ──────────────────────────────────────────── */

export function sortSmart(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => scoreItem(b) - scoreItem(a));
}

/* ─── Internal scoring ───────────────────────────────────── */

function getPopularityScore(item: FeedItem): number {
  const d = item.data;
  if (d.kind === "POST") return d.likes + d.comments * 2 + d.shares * 3;
  if (d.kind === "EVENT") return d.participants;
  if (d.kind === "NETWORKING") return d.compatibility;
  return item.priority;
}

function scoreItem(item: FeedItem): number {
  let score = item.priority * 10;

  // Recency: items < 1h old get a boost
  const ageMs = Date.now() - item.createdAt.getTime();
  const oneHour = 60 * 60 * 1000;
  if (ageMs < oneHour) score += 50;
  else if (ageMs < oneHour * 6) score += 20;
  else if (ageMs < oneHour * 24) score += 5;

  // Proximity: closer = higher
  if (item.distance <= 100) score += 30;
  else if (item.distance <= 500) score += 20;
  else if (item.distance <= 2000) score += 10;

  // Interest match
  score += item.interests.length * 5;

  // Type boosts
  if (item.type === "MOMENT") score += 15;
  if (item.type === "EVENT") score += 10;

  return score;
}
