import { type Recommendation, type EngineUser, RecommendationType } from "./engine-types";

export function getMarketplaceRecommendations(
  recs: Recommendation[],
  user: EngineUser,
): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.BUSINESS || r.type === RecommendationType.OFFER)
    .sort((a, b) => b.score.total - a.score.total);
}

export function getBestOffers(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.OFFER)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "offer" ? a.metadata : null;
      const bMeta = b.metadata.kind === "offer" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.discountPercent - aMeta.discountPercent;
    });
}

export function getPopularBusinesses(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.BUSINESS)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "business" ? a.metadata : null;
      const bMeta = b.metadata.kind === "business" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.rating - aMeta.rating;
    });
}

export function getBusinessesByCategory(
  recs: Recommendation[],
  category: string,
): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.BUSINESS &&
        r.metadata.kind === "business" &&
        r.metadata.category === category,
    )
    .sort((a, b) => b.score.total - a.score.total);
}

export function getFollowedBusinesses(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.BUSINESS &&
        r.metadata.kind === "business" &&
        r.metadata.isFollowing,
    )
    .sort((a, b) => b.score.total - a.score.total);
}
