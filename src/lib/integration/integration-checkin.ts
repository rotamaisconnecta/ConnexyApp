/* ==== integration-checkin.ts -- Check-in integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  CheckinTransitionValue,
  PlaceStatusValue,
  EventCheckinCounts,
  ProfileCheckinData,
} from "./integration-types";
import { IntegrationAction, CheckinTransition, CheckinTransitionMeta } from "./integration-types";
import { generateIntegrationId, getPlaceStatus, haversineDistance } from "./integration-utils";

/* ==== Checkin integration data ==== */

export interface CheckinIntegrationData {
  userId: string;
  userName: string;
  userPhoto: string;
  eventId: string;
  eventName: string;
  transition: CheckinTransitionValue;
  placeId?: string;
  placeName?: string;
  placeLat?: number;
  placeLng?: number;
  timestamp: string;
}

/* ==== Create checkin integration event ==== */

export function createCheckinEvent(
  userId: string,
  userName: string,
  userPhoto: string,
  eventId: string,
  eventName: string,
  transition: CheckinTransitionValue,
  placeId?: string,
  placeName?: string,
  placeLat?: number,
  placeLng?: number,
): IntegrationEvent {
  const targets: IntegrationEvent["targets"] = [
    "MOMENTS",
    "FEED",
    "MAP",
    "PROFILE",
    "NOTIFICATIONS",
  ];

  return {
    id: generateIntegrationId("chk"),
    action: IntegrationAction.CHECKIN_CREATED,
    sourceTarget: "CHECKIN",
    targets,
    timestamp: new Date().toISOString(),
    payload: {
      kind: "checkin",
      userId,
      userName,
      eventId,
      eventName,
      transition,
      placeId,
      placeName,
      placeLat,
      placeLng,
    },
    processed: false,
  };
}

/* ==== Checkin transition helpers ==== */

export function getCheckinTransitionLabel(transition: CheckinTransitionValue): string {
  return CheckinTransitionMeta[transition].label;
}

export function getCheckinTransitionEmoji(transition: CheckinTransitionValue): string {
  return CheckinTransitionMeta[transition].emoji;
}

export function shouldTriggerFeed(transition: CheckinTransitionValue): boolean {
  return CheckinTransitionMeta[transition].triggersFeed;
}

/* ==== Checkin flow validation ==== */

export function isValidTransition(
  current: CheckinTransitionValue | null,
  next: CheckinTransitionValue,
): boolean {
  if (current === null) return next === CheckinTransition.INTERESTED;

  const validPaths: Record<CheckinTransitionValue, CheckinTransitionValue[]> = {
    INTERESTED: [
      CheckinTransition.GOING,
      CheckinTransition.CHECKED_IN,
      CheckinTransition.LEFT_EVENT,
    ],
    GOING: [CheckinTransition.CHECKED_IN, CheckinTransition.LEFT_EVENT],
    CHECKED_IN: [CheckinTransition.LEFT_EVENT],
    LEFT_EVENT: [CheckinTransition.INTERESTED],
  };

  return validPaths[current]?.includes(next) ?? false;
}

/* ==== Checkin aggregation by event ==== */

export function aggregateCheckinsByEvent(checkins: ProfileCheckinData[]): EventCheckinCounts[] {
  const countsMap = new Map<
    string,
    { interested: number; going: number; checkedIn: number; left: number }
  >();

  for (const checkin of checkins) {
    const eventId = checkin.eventId ?? checkin.placeId;
    const existing = countsMap.get(eventId) ?? {
      interested: 0,
      going: 0,
      checkedIn: 0,
      left: 0,
    };

    switch (checkin.transition) {
      case CheckinTransition.INTERESTED:
        existing.interested += 1;
        break;
      case CheckinTransition.GOING:
        existing.going += 1;
        break;
      case CheckinTransition.CHECKED_IN:
        existing.checkedIn += 1;
        break;
      case CheckinTransition.LEFT_EVENT:
        existing.left += 1;
        break;
    }

    countsMap.set(eventId, existing);
  }

  return Array.from(countsMap.entries()).map(([eventId, counts]) => ({
    eventId,
    ...counts,
    total: counts.interested + counts.going + counts.checkedIn,
  }));
}

export function getEventCheckinCounts(
  eventId: string,
  checkins: ProfileCheckinData[],
): EventCheckinCounts {
  const eventCheckins = checkins.filter((c) => c.eventId === eventId);
  const counts = aggregateCheckinsByEvent(eventCheckins);
  return (
    counts[0] ?? {
      eventId,
      interested: 0,
      going: 0,
      checkedIn: 0,
      left: 0,
      total: 0,
    }
  );
}

/* ==== Checkin feed text generation ==== */

export function generateCheckinFeedText(checkin: CheckinIntegrationData): {
  text: string;
  emoji: string;
} {
  const label = getCheckinTransitionLabel(checkin.transition);
  const target = checkin.placeName ?? checkin.eventName;

  if (checkin.transition === CheckinTransition.LEFT_EVENT) {
    return {
      text: `${checkin.userName} saiu de ${target}`,
      emoji: "👋",
    };
  }

  return {
    text: `${checkin.userName} está ${label.toLowerCase()} em ${target}`,
    emoji: getCheckinTransitionEmoji(checkin.transition),
  };
}

/* ==== Checkin notification generation ==== */

export function generateCheckinNotification(
  checkin: CheckinIntegrationData,
  friendIds: string[],
): { title: string; body: string; priority: "LOW" | "MEDIUM" | "HIGH" } | null {
  const isFriend = friendIds.includes(checkin.userId);
  if (!isFriend) return null;

  if (checkin.transition === CheckinTransition.CHECKED_IN) {
    return {
      title: `📍 ${checkin.userName}`,
      body: `chegou em ${checkin.placeName ?? checkin.eventName}`,
      priority: "MEDIUM",
    };
  }

  if (checkin.transition === CheckinTransition.INTERESTED) {
    return {
      title: `💡 ${checkin.userName}`,
      body: `tem interesse em ${checkin.eventName}`,
      priority: "LOW",
    };
  }

  return null;
}

/* ==== Checkin place status update ==== */

export function computePlaceStatusFromCheckins(
  recentCheckins: { placeId: string; transition: CheckinTransitionValue; timestamp: string }[],
  activeEvents: string[],
  placeId: string,
  windowMs = 3600000,
): PlaceStatusValue {
  const now = Date.now();
  const relevantCheckins = recentCheckins.filter(
    (c) =>
      c.placeId === placeId &&
      c.transition === CheckinTransition.CHECKED_IN &&
      now - new Date(c.timestamp).getTime() <= windowMs,
  );

  const eventHappening = activeEvents.includes(placeId);
  return getPlaceStatus(relevantCheckins.length, eventHappening);
}

/* ==== Checkin profile update data ==== */

export function computeProfileCheckinUpdate(checkin: CheckinIntegrationData): {
  placesCheckedIn: string[];
  eventsAttended: string[];
} {
  const places = checkin.placeId ? [checkin.placeId] : [];
  const events = checkin.transition === CheckinTransition.CHECKED_IN ? [checkin.eventId] : [];

  return {
    placesCheckedIn: places,
    eventsAttended: events,
  };
}

/* ==== Checkin map data ==== */

export function createCheckinMapUpdate(
  checkins: CheckinIntegrationData[],
  userLat: number,
  userLng: number,
  maxDistanceMeters = 5000,
): {
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  checkinCount: number;
  isNearby: boolean;
}[] {
  const grouped = new Map<string, { placeName: string; lat: number; lng: number; count: number }>();

  for (const checkin of checkins) {
    if (!checkin.placeLat || !checkin.placeLng || !checkin.placeId) continue;

    const existing = grouped.get(checkin.placeId) ?? {
      placeName: checkin.placeName ?? "Local",
      lat: checkin.placeLat,
      lng: checkin.placeLng,
      count: 0,
    };
    existing.count += 1;
    grouped.set(checkin.placeId, existing);
  }

  return Array.from(grouped.entries()).map(([placeId, data]) => {
    const distance = haversineDistance(userLat, userLng, data.lat, data.lng);
    return {
      placeId,
      placeName: data.placeName,
      lat: data.lat,
      lng: data.lng,
      checkinCount: data.count,
      isNearby: distance <= maxDistanceMeters,
    };
  });
}
