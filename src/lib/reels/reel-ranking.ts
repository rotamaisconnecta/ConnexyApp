import type { Reel, ReelCategoryValue } from "./reel-types";
import { REEL_CATEGORY_META } from "./reel-types";

export function sortByDistance(reels: Reel[]): Reel[] {
  return [...reels].sort((a, b) => {
    const dA = a.location?.distanceMeters ?? Infinity;
    const dB = b.location?.distanceMeters ?? Infinity;
    return dA - dB;
  });
}

export function sortByInterest(reels: Reel[]): Reel[] {
  const categoryScore: Record<ReelCategoryValue, number> = {
    PERSON: 5,
    BUSINESS: 4,
    EVENT: 4,
    PLACE: 3,
    OFFER: 3,
    DRIVER: 2,
    NETWORKING: 5,
    TRAVEL: 3,
    MOMENT: 4,
  };
  return [...reels].sort((a, b) => {
    const scoreA = categoryScore[a.category] ?? 0;
    const scoreB = categoryScore[b.category] ?? 0;
    return scoreB - scoreA;
  });
}

function engagementScore(reel: Reel): number {
  return reel.stats.likes * 1 + reel.stats.comments * 2 + reel.stats.shares * 3;
}

export function sortByPopularity(reels: Reel[]): Reel[] {
  return [...reels].sort((a, b) => engagementScore(b) - engagementScore(a));
}

export function sortByRecent(reels: Reel[]): Reel[] {
  return [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sortSmart(reels: Reel[]): Reel[] {
  const now = Date.now();
  const maxDist = Math.max(...reels.map((r) => r.location?.distanceMeters ?? 0), 1);
  const maxPop = Math.max(...reels.map(engagementScore), 1);
  const maxAge = Math.max(...reels.map((r) => now - new Date(r.createdAt).getTime()), 1);

  return [...reels].sort((a, b) => {
    const popA = engagementScore(a) / maxPop;
    const popB = engagementScore(b) / maxPop;

    const ageA = (now - new Date(a.createdAt).getTime()) / maxAge;
    const ageB = (now - new Date(b.createdAt).getTime()) / maxAge;

    const distA = a.location ? a.location.distanceMeters / maxDist : 1;
    const distB = b.location ? b.location.distanceMeters / maxDist : 1;

    const scoreA = popA * 0.4 + (1 - ageA) * 0.3 + (1 - distA) * 0.3;
    const scoreB = popB * 0.4 + (1 - ageB) * 0.3 + (1 - distB) * 0.3;

    return scoreB - scoreA;
  });
}

export function getReelsByCategory(reels: Reel[], cat: ReelCategoryValue): Reel[] {
  return reels.filter((r) => r.category === cat);
}

export function getRecommendations(reels: Reel[], current: Reel): Reel[] {
  return sortSmart(reels.filter((r) => r.id !== current.id)).slice(0, 3);
}

export function calculateEngagementScore(reel: Reel): number {
  return engagementScore(reel);
}
