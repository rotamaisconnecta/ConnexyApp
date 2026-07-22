import {
  type Recommendation,
  type EngineUser,
  RecommendationType,
} from "./engine-types";

export function getReelRecommendations(
  recs: Recommendation[],
  user: EngineUser,
): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.REEL)
    .sort((a, b) => b.score.total - a.score.total);
}

export function getRelatedReels(
  reel: Recommendation,
  allRecs: Recommendation[],
): Recommendation[] {
  const reelMeta = reel.metadata.kind === "reel" ? reel.metadata : null;
  if (!reelMeta) return [];

  return allRecs
    .filter(
      (r) =>
        r.id !== reel.id &&
        r.type === RecommendationType.REEL &&
        r.metadata.kind === "reel" &&
        r.metadata.category === reelMeta.category,
    )
    .sort((a, b) => b.score.compatibility - a.score.compatibility);
}

export function getReelsByAuthor(
  reel: Recommendation,
  allRecs: Recommendation[],
): Recommendation[] {
  const reelMeta = reel.metadata.kind === "reel" ? reel.metadata : null;
  if (!reelMeta) return [];

  return allRecs
    .filter(
      (r) =>
        r.id !== reel.id &&
        r.type === RecommendationType.REEL &&
        r.metadata.kind === "reel" &&
        r.metadata.authorName === reelMeta.authorName,
    )
    .sort((a, b) => b.score.total - a.score.total);
}

export function getTrendingReels(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.REEL &&
        (r.trending ||
          (r.metadata.kind === "reel" &&
            r.metadata.likes + r.metadata.comments > 100)),
    )
    .sort((a, b) => b.score.popularity - a.score.popularity);
}
