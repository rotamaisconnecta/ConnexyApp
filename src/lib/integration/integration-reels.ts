/* ==== integration-reels.ts -- Reels integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  EngineReelInput,
  ReelIntegrationData,
} from "./integration-types";
import { IntegrationAction } from "./integration-types";
import { generateIntegrationId, haversineDistance, getOverlapScore } from "./integration-utils";

/* ==== Create reel integration event ==== */

export function createReelIntegrationEvent(
  reelId: string,
  authorId: string,
  authorName: string,
  category: string,
  locationId?: string,
  locationName?: string,
  eventId?: string,
  eventName?: string,
): IntegrationEvent {
  return {
    id: generateIntegrationId("rl"),
    action: IntegrationAction.REEL_POSTED,
    sourceTarget: "REELS",
    targets: ["FEED", "MAP", "MARKETPLACE", "EVENTS", "PROFILE", "ENGINE"],
    timestamp: new Date().toISOString(),
    payload: {
      kind: "reel",
      reelId,
      authorId,
      authorName,
      category,
      locationId,
      locationName,
      eventId,
      eventName,
    },
    processed: false,
  };
}

/* ==== Reel data transformation ==== */

export function toEngineReelInput(data: ReelIntegrationData): EngineReelInput {
  return {
    id: data.reelId,
    authorId: data.authorId,
    category: data.category,
    viewCount: data.viewCount,
    likeCount: data.likeCount,
    locationId: data.locationId,
  };
}

/* ==== Reel propagation targets ==== */

export function getReelPropagationTargets(
  hasLocation: boolean,
  hasEvent: boolean,
  hasBusiness: boolean,
): {
  feed: boolean;
  placePage: boolean;
  businessPage: boolean;
  eventPage: boolean;
  profile: boolean;
  map: boolean;
  engine: boolean;
} {
  return {
    feed: true,
    placePage: hasLocation,
    businessPage: hasBusiness,
    eventPage: hasEvent,
    profile: true,
    map: hasLocation,
    engine: true,
  };
}

/* ==== Reel scoring for recommendations ==== */

export function scoreReelForRecommendation(
  reel: ReelIntegrationData,
  userInterests: string[],
  userLat: number,
  userLng: number,
  now: Date = new Date(),
): number {
  let score = 0;

  const interestScore = getOverlapScore(userInterests, reel.hashtags);
  score += interestScore * 30;

  if (reel.locationLat && reel.locationLng) {
    const distance = haversineDistance(userLat, userLng, reel.locationLat, reel.locationLng);
    if (distance < 1000) score += 25;
    else if (distance < 3000) score += 15;
    else if (distance < 5000) score += 5;
  }

  const engagement =
    reel.viewCount > 0
      ? (reel.likeCount + reel.commentCount + reel.shareCount) / reel.viewCount
      : 0;
  score += Math.min(engagement * 100, 20);

  const ageMs = now.getTime() - new Date(reel.createdAt).getTime();
  const ageHr = ageMs / 3600000;
  if (ageHr < 1) score += 15;
  else if (ageHr < 6) score += 10;
  else if (ageHr < 24) score += 5;

  return Math.min(score, 100);
}

/* ==== Reel map marker data ==== */

export function createReelMarkerData(
  reel: ReelIntegrationData,
  userLat: number,
  userLng: number,
): {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  distanceMeters: number;
} | null {
  if (!reel.locationLat || !reel.locationLng) return null;

  return {
    id: reel.reelId,
    lat: reel.locationLat,
    lng: reel.locationLng,
    title: `${reel.authorName} • Reel`,
    subtitle: reel.locationName ?? reel.category,
    distanceMeters: haversineDistance(userLat, userLng, reel.locationLat, reel.locationLng),
  };
}

/* ==== Reel feed text generation ==== */

export function generateReelFeedText(reel: ReelIntegrationData): { text: string; emoji: string } {
  let locationSuffix = "";
  if (reel.locationName) {
    locationSuffix = ` em ${reel.locationName}`;
  } else if (reel.eventName) {
    locationSuffix = ` no evento ${reel.eventName}`;
  }

  return {
    text: `${reel.authorName} postou um reel${locationSuffix}`,
    emoji: "🎬",
  };
}

/* ==== Reel notification generation ==== */

export function generateReelNotification(
  reel: ReelIntegrationData,
  userLat: number,
  userLng: number,
  followingIds: string[],
): { title: string; body: string; priority: "LOW" | "MEDIUM" | "HIGH" } | null {
  const isFollowing = followingIds.includes(reel.authorId);

  if (isFollowing) {
    return {
      title: `🎬 ${reel.authorName}`,
      body: `postou um novo reel${reel.locationName ? ` em ${reel.locationName}` : ""}`,
      priority: "MEDIUM",
    };
  }

  if (reel.locationLat && reel.locationLng) {
    const distance = haversineDistance(userLat, userLng, reel.locationLat, reel.locationLng);
    if (distance < 2000) {
      return {
        title: `📍 Reel próximo`,
        body: `Reel de ${reel.authorName} em ${reel.locationName ?? "localização próxima"}`,
        priority: "LOW",
      };
    }
  }

  return null;
}

/* ==== Reel trending detection ==== */

export function detectReelTrending(
  reel: ReelIntegrationData,
  allReels: ReelIntegrationData[],
  now: Date = new Date(),
): {
  isTrending: boolean;
  engagementPercentile: number;
  velocityPerHour: number;
} {
  const reelAgeHr = Math.max(0.1, (now.getTime() - new Date(reel.createdAt).getTime()) / 3600000);

  const totalEngagement = reel.likeCount + reel.commentCount + reel.shareCount;
  const velocityPerHour = totalEngagement / reelAgeHr;

  const allVelocities = allReels.map((r) => {
    const ageHr = Math.max(0.1, (now.getTime() - new Date(r.createdAt).getTime()) / 3600000);
    const eng = r.likeCount + r.commentCount + r.shareCount;
    return eng / ageHr;
  });

  const sorted = [...allVelocities].sort((a, b) => b - a);
  const rank = sorted.indexOf(velocityPerHour);
  const percentile = ((sorted.length - rank) / sorted.length) * 100;

  return {
    isTrending: percentile >= 80,
    engagementPercentile: percentile,
    velocityPerHour,
  };
}

/* ==== Reel engine input batch ==== */

export function generateReelEngineInputs(reels: ReelIntegrationData[]): EngineReelInput[] {
  return reels.map(toEngineReelInput);
}

/* ==== Reel aggregation by category ==== */

export function aggregateReelsByCategory(
  reels: ReelIntegrationData[],
): Map<string, { count: number; totalViews: number; totalLikes: number }> {
  const map = new Map<string, { count: number; totalViews: number; totalLikes: number }>();

  for (const reel of reels) {
    const existing = map.get(reel.category) ?? {
      count: 0,
      totalViews: 0,
      totalLikes: 0,
    };
    existing.count += 1;
    existing.totalViews += reel.viewCount;
    existing.totalLikes += reel.likeCount;
    map.set(reel.category, existing);
  }

  return map;
}

/* ==== Reel profile section data ==== */

export function getReelProfileSection(
  reels: ReelIntegrationData[],
  userId: string,
): {
  totalPosted: number;
  totalViews: number;
  totalLikes: number;
  topReel: ReelIntegrationData | null;
  recentReels: ReelIntegrationData[];
} {
  const userReels = reels.filter((r) => r.authorId === userId);
  const totalViews = userReels.reduce((s, r) => s + r.viewCount, 0);
  const totalLikes = userReels.reduce((s, r) => s + r.likeCount, 0);

  const topReel =
    userReels.length > 0
      ? userReels.reduce((best, r) => (r.viewCount > best.viewCount ? r : best))
      : null;

  const recentReels = [...userReels]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalPosted: userReels.length,
    totalViews,
    totalLikes,
    topReel,
    recentReels,
  };
}
