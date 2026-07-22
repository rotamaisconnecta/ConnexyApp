import {
  RecommendationType,
  type Recommendation,
  type RecommendationTypeValue,
} from "./engine-types";

export function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort((a, b) => b.score.total - a.score.total);
}

export function sortPeople(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.PERSON)
    .sort((a, b) => b.score.total - a.score.total);
}

export function sortEvents(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.EVENT)
    .sort((a, b) => b.score.total - a.score.total);
}

export function sortBusinesses(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.BUSINESS)
    .sort((a, b) => b.score.total - a.score.total);
}

export function sortDrivers(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.DRIVER)
    .sort((a, b) => {
      const scoreDiff = b.score.total - a.score.total;
      if (scoreDiff !== 0) return scoreDiff;
      const aMeta = a.metadata.kind === "driver" ? a.metadata : null;
      const bMeta = b.metadata.kind === "driver" ? b.metadata : null;
      if (aMeta && bMeta) return aMeta.rating - bMeta.rating;
      return 0;
    });
}

export function sortOffers(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.OFFER)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "offer" ? a.metadata : null;
      const bMeta = b.metadata.kind === "offer" ? b.metadata : null;
      if (aMeta && bMeta) return bMeta.discountPercent - aMeta.discountPercent;
      return b.score.total - a.score.total;
    });
}

export function sortReels(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.REEL)
    .sort((a, b) => b.score.popularity - a.score.popularity);
}

export function getTopN(
  recs: Recommendation[],
  n: number,
  type?: RecommendationTypeValue,
): Recommendation[] {
  const filtered = type ? recs.filter((r) => r.type === type) : recs;
  return sortRecommendations(filtered).slice(0, n);
}
