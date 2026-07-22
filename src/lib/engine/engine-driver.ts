import { type Recommendation, RecommendationType } from "./engine-types";

export function getDriverRecommendations(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.DRIVER)
    .sort((a, b) => b.score.total - a.score.total);
}

export function getNearestDrivers(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.DRIVER)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function getBestRatedDrivers(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.DRIVER)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "driver" ? a.metadata : null;
      const bMeta = b.metadata.kind === "driver" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.rating - aMeta.rating;
    });
}

export function getAvailableDrivers(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.DRIVER &&
        r.metadata.kind === "driver" &&
        r.metadata.isAvailable,
    )
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function getFastestDriver(recs: Recommendation[]): Recommendation | null {
  const available = getAvailableDrivers(recs);
  if (available.length === 0) return null;

  return available.reduce<Recommendation>((fastest, current) => {
    const fastestMeta = fastest.metadata.kind === "driver" ? fastest.metadata : null;
    const currentMeta = current.metadata.kind === "driver" ? current.metadata : null;
    if (!fastestMeta || !currentMeta) return fastest;
    return currentMeta.etaMinutes < fastestMeta.etaMinutes ? current : fastest;
  }, available[0]);
}
