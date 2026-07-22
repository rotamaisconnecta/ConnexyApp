/* ==== integration-profile.ts -- Profile integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  ProfileStats,
  ProfileActivity,
  CheckinTransitionValue,
  ProfileCheckinData,
  ProfileEventData,
  ProfileReelData,
  ProfileMomentData,
  ProfileConnectionData,
  ProfileMileData,
} from "./integration-types";
import { CheckinTransition } from "./integration-types";
import { generateIntegrationId, formatDistance } from "./integration-utils";

/* ==== Profile stats computation ==== */

export function computeProfileStats(
  checkins: ProfileCheckinData[],
  events: ProfileEventData[],
  reels: ProfileReelData[],
  moments: ProfileMomentData[],
  connections: ProfileConnectionData[],
  miles: ProfileMileData[],
  userId: string,
): ProfileStats {
  const userCheckins = checkins.filter(
    (c) => c.userId === userId && c.transition === CheckinTransition.CHECKED_IN,
  );
  const userEvents = events.filter(
    (e) => e.userId === userId && e.transition === CheckinTransition.CHECKED_IN,
  );
  const userReels = reels.filter((r) => r.userId === userId);
  const userMoments = moments.filter((m) => m.userId === userId);
  const userConnections = connections.filter((c) => c.userId === userId);
  const userMiles = miles.filter((m) => m.userId === userId);

  const uniquePlaces = new Set(userCheckins.map((c) => c.placeId));
  const uniqueEvents = new Set(userEvents.map((e) => e.eventId));
  const totalMeters = userMiles.reduce((s, m) => s + m.distanceMeters, 0);

  return {
    visitedPlaces: uniquePlaces.size,
    eventsAttended: uniqueEvents.size,
    placesCheckedIn: userCheckins.length,
    reelsPosted: userReels.length,
    momentsPosted: userMoments.length,
    milesTraveled: Math.round(totalMeters / 1000),
    connectionsMade: userConnections.length,
  };
}

/* ==== Profile activity generation ==== */

export function generateProfileActivities(
  checkins: ProfileCheckinData[],
  events: ProfileEventData[],
  reels: ProfileReelData[],
  moments: ProfileMomentData[],
  connections: ProfileConnectionData[],
  userId: string,
): ProfileActivity[] {
  const activities: ProfileActivity[] = [];

  for (const c of checkins) {
    if (c.userId !== userId) continue;
    if (c.transition !== CheckinTransition.CHECKED_IN) continue;

    activities.push({
      id: generateIntegrationId("act"),
      type: "checkin",
      title: `Check-in: ${c.placeName}`,
      subtitle: c.placeName,
      date: c.timestamp,
      icon: "📍",
    });
  }

  for (const e of events) {
    if (e.userId !== userId) continue;
    if (e.transition !== CheckinTransition.CHECKED_IN) continue;

    activities.push({
      id: generateIntegrationId("act"),
      type: "event_attendance",
      title: e.eventName,
      subtitle: `${e.venue} • ${e.category}`,
      date: e.startDate,
      icon: "📅",
    });
  }

  for (const r of reels) {
    if (r.userId !== userId) continue;

    activities.push({
      id: generateIntegrationId("act"),
      type: "reel_post",
      title: `Reel: ${r.category}`,
      subtitle: `${r.viewCount} views • ${r.likeCount} likes`,
      date: r.createdAt,
      icon: "🎬",
    });
  }

  for (const m of moments) {
    if (m.userId !== userId) continue;

    activities.push({
      id: generateIntegrationId("act"),
      type: "moment_post",
      title: m.text.slice(0, 50) + (m.text.length > 50 ? "..." : ""),
      subtitle: m.placeName ?? "Momento",
      date: m.createdAt,
      icon: "✨",
    });
  }

  for (const conn of connections) {
    if (conn.userId !== userId) continue;

    activities.push({
      id: generateIntegrationId("act"),
      type: "connection",
      title: `Conexão: ${conn.connectedUserName}`,
      subtitle: "Nova conexão",
      date: conn.connectedAt,
      icon: "🤝",
    });
  }

  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ==== Profile section data ==== */

export function getProfileVisitedPlaces(
  checkins: ProfileCheckinData[],
  userId: string,
): { placeId: string; placeName: string; visitCount: number; lastVisit: string }[] {
  const userCheckins = checkins.filter(
    (c) => c.userId === userId && c.transition === CheckinTransition.CHECKED_IN,
  );

  const placeMap = new Map<string, { placeName: string; count: number; lastVisit: string }>();

  for (const c of userCheckins) {
    const existing = placeMap.get(c.placeId) ?? {
      placeName: c.placeName,
      count: 0,
      lastVisit: c.timestamp,
    };
    existing.count += 1;
    if (c.timestamp > existing.lastVisit) existing.lastVisit = c.timestamp;
    placeMap.set(c.placeId, existing);
  }

  return Array.from(placeMap.entries())
    .map(([placeId, data]) => ({
      placeId,
      placeName: data.placeName,
      visitCount: data.count,
      lastVisit: data.lastVisit,
    }))
    .sort((a, b) => b.visitCount - a.visitCount);
}

export function getProfileEventsAttended(
  events: ProfileEventData[],
  userId: string,
): { eventId: string; eventName: string; category: string; venue: string; date: string }[] {
  return events
    .filter((e) => e.userId === userId && e.transition === CheckinTransition.CHECKED_IN)
    .map((e) => ({
      eventId: e.eventId,
      eventName: e.eventName,
      category: e.category,
      venue: e.venue,
      date: e.startDate,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getProfileReelsPosted(
  reels: ProfileReelData[],
  userId: string,
): { reelId: string; category: string; views: number; likes: number; createdAt: string }[] {
  return reels
    .filter((r) => r.userId === userId)
    .map((r) => ({
      reelId: r.reelId,
      category: r.category,
      views: r.viewCount,
      likes: r.likeCount,
      createdAt: r.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getProfileMomentsPosted(
  moments: ProfileMomentData[],
  userId: string,
): { momentId: string; text: string; placeName?: string; createdAt: string }[] {
  return moments
    .filter((m) => m.userId === userId)
    .map((m) => ({
      momentId: m.momentId,
      text: m.text,
      placeName: m.placeName,
      createdAt: m.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getProfileMilesTraveled(
  miles: ProfileMileData[],
  userId: string,
): {
  totalKm: number;
  longestTrip: { distance: number; from?: string; to?: string; date: string } | null;
  recentTrips: { distance: number; from?: string; to?: string; date: string }[];
} {
  const userMiles = miles.filter((m) => m.userId === userId);
  const totalMeters = userMiles.reduce((s, m) => s + m.distanceMeters, 0);

  const sorted = [...userMiles].sort((a, b) => b.distanceMeters - a.distanceMeters);
  const longest = sorted[0];

  const recent = [...userMiles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((m) => ({
      distance: m.distanceMeters,
      from: m.fromPlace,
      to: m.toPlace,
      date: m.date,
    }));

  return {
    totalKm: Math.round(totalMeters / 1000),
    longestTrip: longest
      ? {
          distance: longest.distanceMeters,
          from: longest.fromPlace,
          to: longest.toPlace,
          date: longest.date,
        }
      : null,
    recentTrips: recent,
  };
}

export function getProfileConnectionsMade(
  connections: ProfileConnectionData[],
  userId: string,
): { connectedUserId: string; connectedUserName: string; connectedAt: string }[] {
  return connections
    .filter((c) => c.userId === userId)
    .map((c) => ({
      connectedUserId: c.connectedUserId,
      connectedUserName: c.connectedUserName,
      connectedAt: c.connectedAt,
    }))
    .sort((a, b) => new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime());
}

/* ==== Profile summary text ==== */

export function getProfileSummaryText(stats: ProfileStats): string {
  const parts: string[] = [];

  if (stats.visitedPlaces > 0) {
    parts.push(`${stats.visitedPlaces} lugar${stats.visitedPlaces > 1 ? "es" : ""}`);
  }
  if (stats.eventsAttended > 0) {
    parts.push(`${stats.eventsAttended} evento${stats.eventsAttended > 1 ? "s" : ""}`);
  }
  if (stats.milesTraveled > 0) {
    parts.push(`${stats.milesTraveled}km`);
  }
  if (stats.connectionsMade > 0) {
    parts.push(`${stats.connectionsMade} conexão${stats.connectionsMade > 1 ? "ões" : ""}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Nenhuma atividade ainda";
}
