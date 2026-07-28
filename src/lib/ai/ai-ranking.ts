/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Ranking
   Sorting and top-N selection.
   Pure TypeScript. No React. No side effects.
============================================================ */

import type { AIEntity, AIScore } from "./ai-types";

/* ─── sortByScore ───────────────────────────────────────── */

export function sortByScore<T extends AIEntity>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

/* ─── sortByPriority ────────────────────────────────────── */

export function sortByPriority<T extends AIEntity>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return b.priority - a.priority;
  });
}

/* ─── rankEntities ──────────────────────────────────────── */

export function rankEntities<T extends AIEntity>(items: T[], scores: Map<string, AIScore>): T[] {
  return [...items]
    .map((item) => {
      const score = scores.get(item.id);
      return {
        ...item,
        score: score?.finalScore ?? item.score,
        priority: score?.finalScore ?? item.priority,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/* ─── top5 ──────────────────────────────────────────────── */

export function top5<T extends AIEntity>(items: T[]): T[] {
  return sortByScore(items).slice(0, 5);
}

/* ─── top10 ─────────────────────────────────────────────── */

export function top10<T extends AIEntity>(items: T[]): T[] {
  return sortByScore(items).slice(0, 10);
}

/* ─── top20 ─────────────────────────────────────────────── */

export function top20<T extends AIEntity>(items: T[]): T[] {
  return sortByScore(items).slice(0, 20);
}

/* ─── filterByType ──────────────────────────────────────── */

export function filterByType<T extends AIEntity>(items: T[], type: AIEntity["type"]): T[] {
  return items.filter((item) => item.type === type);
}

/* ─── deduplicate ───────────────────────────────────────── */

export function deduplicate<T extends AIEntity>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
