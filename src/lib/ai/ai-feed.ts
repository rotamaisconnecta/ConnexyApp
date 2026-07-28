/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Feed Ranking
   Ranks feed items using all AI scoring dimensions.
   Pure TypeScript. No React. No side effects.
============================================================ */

import type { AIEntity, AIContextSignal, AIProfile, AIScore, AIEntityTypeValue } from "./ai-types";
import { buildFullScore } from "./ai-score";
import { sortByScore, deduplicate } from "./ai-ranking";
import type { FeedItem } from "@/lib/feed/feed-types";

/* ─── FeedItem → AIEntity ──────────────────────────────── */

export function feedItemToEntity(item: FeedItem): AIEntity {
  const kind = item.type as AIEntityTypeValue;
  return {
    id: item.id,
    type: (
      ["POST", "MOMENT", "PLACE", "EVENT", "OFFER", "ROUTE", "NETWORKING"] as string[]
    ).includes(kind)
      ? kind
      : "FEED",
    distance: item.distance ?? 0,
    rating: 0,
    activity: 0,
    popularity: extractPopularity(item),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.createdAt.toISOString(),
    tags: item.interests ?? [],
    interests: item.interests ?? [],
    score: 0,
    priority: item.priority ?? 0,
  };
}

function extractPopularity(item: FeedItem): number {
  const data = item.data;
  if (data.kind === "POST") return data.likes + data.comments + data.shares;
  if (data.kind === "EVENT") return data.participants;
  if (data.kind === "NETWORKING") return data.compatibility;
  return 0;
}

/* ─── rankFeed ──────────────────────────────────────────── */

export function rankFeed(
  items: FeedItem[],
  profile: AIProfile,
  context: AIContextSignal,
  historyMap: Map<string, number>,
  totalInteractions: number,
): AIEntity[] {
  const entities = items.map((item) => feedItemToEntity(item));
  const scored = scoreFeedEntities(entities, profile, context, historyMap, totalInteractions);
  return sortByScore(deduplicate(scored));
}

/* ─── Internal ──────────────────────────────────────────── */

function scoreFeedEntities(
  entities: AIEntity[],
  profile: AIProfile,
  context: AIContextSignal,
  historyMap: Map<string, number>,
  totalInteractions: number,
): AIEntity[] {
  return entities.map((entity) => {
    const score = buildFullScore(
      entity.distance,
      context,
      [...profile.interests, ...profile.tags],
      entity.tags,
      entity.id,
      historyMap,
      totalInteractions,
      entity.popularity,
      1000,
      entity.updatedAt,
    );

    return {
      ...entity,
      score: score.finalScore,
      priority: score.finalScore,
    };
  });
}

/* ─── rankFeedItems (direct FeedItem input) ─────────────── */

export function rankFeedItems(
  items: FeedItem[],
  profile: AIProfile,
  context: AIContextSignal,
  historyMap: Map<string, number>,
  totalInteractions: number,
): { items: FeedItem[]; scores: Map<string, AIScore> } {
  const scores = new Map<string, AIScore>();

  const ranked = items.map((item) => {
    const entity = feedItemToEntity(item);
    const score = buildFullScore(
      entity.distance,
      context,
      [...profile.interests, ...profile.tags],
      entity.tags,
      entity.id,
      historyMap,
      totalInteractions,
      entity.popularity,
      1000,
      entity.updatedAt,
    );

    scores.set(item.id, score);
    return { item, score: score.finalScore };
  });

  ranked.sort((a, b) => b.score - a.score);

  return {
    items: ranked.map((r) => r.item),
    scores,
  };
}
