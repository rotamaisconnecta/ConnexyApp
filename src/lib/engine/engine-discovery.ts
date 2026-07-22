import { type Recommendation, type EngineUser, RecommendationType } from "./engine-types";

export function getDiscoveryRecommendations(
  recs: Recommendation[],
  user: EngineUser,
): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.PERSON || r.type === RecommendationType.NETWORKING)
    .sort((a, b) => b.score.total - a.score.total);
}

export function getCompatiblePeople(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.PERSON)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "person" ? a.metadata : null;
      const bMeta = b.metadata.kind === "person" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.compatibilityPercent - aMeta.compatibilityPercent;
    });
}

export function getNearbyPeople(
  recs: Recommendation[],
  maxDistance: number = 5000,
): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.PERSON && r.distanceMeters <= maxDistance)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function getOnlinePeople(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.PERSON && r.metadata.kind === "person" && r.metadata.isOnline,
    )
    .sort((a, b) => b.score.total - a.score.total);
}

export function getPeopleAtSameEvent(recs: Recommendation[], eventName: string): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.NETWORKING &&
        r.metadata.kind === "networking" &&
        r.metadata.eventName === eventName,
    )
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "networking" ? a.metadata : null;
      const bMeta = b.metadata.kind === "networking" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.matchPercent - aMeta.matchPercent;
    });
}

export function getNetworkingOpportunities(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.NETWORKING)
    .sort((a, b) => b.score.total - a.score.total);
}
