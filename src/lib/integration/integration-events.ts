/* ==== integration-events.ts -- Event integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  EngineEventInput,
  HeatLevelValue,
} from "./integration-types";
import { IntegrationAction, HeatLevel } from "./integration-types";
import {
  generateIntegrationId,
  haversineDistance,
  getHeatLevel,
  isEventActive,
  isEventUpcoming,
} from "./integration-utils";

/* ==== Event integration data ==== */

export interface EventIntegrationData {
  eventId: string;
  name: string;
  category: string;
  venue: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  attendeeCount: number;
  heatLevel: HeatLevelValue;
  isActive: boolean;
  isUpcoming: boolean;
  feedGenerated: boolean;
  mapUpdated: boolean;
  notificationsSent: boolean;
  engineProcessed: boolean;
  reelsCreated: number;
}

/* ==== Create integration event for new events ==== */

export function createEventIntegration(
  eventId: string,
  name: string,
  category: string,
  venue: string,
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
  organizerId: string,
): IntegrationEvent {
  return {
    id: generateIntegrationId("evt"),
    action: IntegrationAction.EVENT_CREATED,
    sourceTarget: "EVENTS",
    targets: ["FEED", "MARKETPLACE", "MAP", "NOTIFICATIONS", "ENGINE", "REELS"],
    timestamp: new Date().toISOString(),
    payload: {
      kind: "event",
      eventId,
      eventName: name,
      category,
      venue,
      startDate,
      endDate,
      organizerId,
    },
    processed: false,
  };
}

/* ==== Event data transformation ==== */

export function toEngineEventInput(
  data: EventIntegrationData,
  userLat: number,
  userLng: number,
): EngineEventInput {
  return {
    id: data.eventId,
    name: data.name,
    category: data.category,
    venue: data.venue,
    lat: data.lat,
    lng: data.lng,
    startDate: data.startDate,
    endDate: data.endDate,
    attendeeCount: data.attendeeCount,
    isInterested: false,
    isAttending: false,
  };
}

/* ==== Event heat calculation ==== */

export function calculateEventHeatLevel(
  attendeeCount: number,
  recentCheckins: number,
  isEventActive: boolean,
): HeatLevelValue {
  if (isEventActive && recentCheckins > 5) return HeatLevel.BURNING;
  if (isEventActive && recentCheckins > 2) return HeatLevel.HOT;
  if (attendeeCount >= 20) return HeatLevel.HOT;
  if (attendeeCount >= 10) return HeatLevel.WARM;
  if (attendeeCount >= 3) return HeatLevel.WARM;
  return HeatLevel.COLD;
}

/* ==== Event propagation to other systems ==== */

export function getEventPropagationTargets(event: IntegrationEvent): {
  feed: boolean;
  marketplace: boolean;
  map: boolean;
  notifications: boolean;
  engine: boolean;
  reels: boolean;
} {
  return {
    feed: true,
    marketplace: true,
    map: true,
    notifications: true,
    engine: true,
    reels: true,
  };
}

/* ==== Event relevance scoring ==== */

export function scoreEventRelevance(
  event: EventIntegrationData,
  userLat: number,
  userLng: number,
  userInterests: string[],
  now: Date = new Date(),
): number {
  let score = 0;

  const distance = haversineDistance(userLat, userLng, event.lat, event.lng);
  if (distance < 500) score += 30;
  else if (distance < 2000) score += 20;
  else if (distance < 5000) score += 10;
  else score += 5;

  if (
    event.category &&
    userInterests.some((i) => event.category.toLowerCase().includes(i.toLowerCase()))
  ) {
    score += 25;
  }

  const startMs = new Date(event.startDate).getTime();
  const diffMs = startMs - now.getTime();
  const diffHr = diffMs / 3600000;
  if (diffHr > 0 && diffHr < 2) score += 20;
  else if (diffHr >= 2 && diffHr < 6) score += 15;
  else if (diffHr >= 6 && diffHr < 24) score += 10;
  else if (diffHr >= 24 && diffHr < 72) score += 5;

  if (event.attendeeCount >= 50) score += 15;
  else if (event.attendeeCount >= 20) score += 10;
  else if (event.attendeeCount >= 5) score += 5;

  if (event.isActive) score += 10;

  return score;
}

/* ==== Event checkin aggregation ==== */

export function aggregateEventCheckins(
  eventCheckins: { eventId: string; transition: string; timestamp: string }[],
): Map<string, { checkedIn: number; interested: number; going: number; left: number }> {
  const map = new Map<
    string,
    { checkedIn: number; interested: number; going: number; left: number }
  >();

  for (const checkin of eventCheckins) {
    const existing = map.get(checkin.eventId) ?? {
      checkedIn: 0,
      interested: 0,
      going: 0,
      left: 0,
    };

    switch (checkin.transition) {
      case "CHECKED_IN":
        existing.checkedIn += 1;
        break;
      case "INTERESTED":
        existing.interested += 1;
        break;
      case "GOING":
        existing.going += 1;
        break;
      case "LEFT_EVENT":
        existing.left += 1;
        break;
    }

    map.set(checkin.eventId, existing);
  }

  return map;
}

/* ==== Event status computation ==== */

export function computeEventStatus(
  startDate: string,
  endDate: string,
  now: Date = new Date(),
): "upcoming" | "active" | "finished" {
  const nowMs = now.getTime();
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  if (nowMs < startMs) return "upcoming";
  if (nowMs >= startMs && nowMs <= endMs) return "active";
  return "finished";
}

export function computeEventTimeInfo(
  startDate: string,
  endDate: string,
  now: Date = new Date(),
): { status: "upcoming" | "active" | "finished"; timeLabel: string; remainingMs: number } {
  const status = computeEventStatus(startDate, endDate, now);
  const nowMs = now.getTime();
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  if (status === "upcoming") {
    const remaining = startMs - nowMs;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return {
      status,
      timeLabel: hours > 0 ? `em ${hours}h ${minutes}min` : `em ${minutes}min`,
      remainingMs: remaining,
    };
  }

  if (status === "active") {
    const remaining = endMs - nowMs;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return {
      status,
      timeLabel: hours > 0 ? `restam ${hours}h ${minutes}min` : `restam ${minutes}min`,
      remainingMs: remaining,
    };
  }

  return { status: "finished", timeLabel: "encerrado", remainingMs: 0 };
}

/* ==== Event feed items generation ==== */

export function generateEventFeedItems(
  events: EventIntegrationData[],
): { eventId: string; feedText: string; emoji: string }[] {
  return events.map((event) => {
    const status = computeEventStatus(event.startDate, event.endDate);
    let emoji = "📅";
    let suffix = "";

    if (status === "active") {
      emoji = "🔴";
      suffix = " • AO VIVO";
    } else if (status === "upcoming") {
      const timeInfo = computeEventTimeInfo(event.startDate, event.endDate);
      suffix = ` • ${timeInfo.timeLabel}`;
    } else {
      suffix = " • encerrado";
    }

    return {
      eventId: event.eventId,
      feedText: `${event.name} • ${event.venue}${suffix}`,
      emoji,
    };
  });
}

/* ==== Event map marker data ==== */

export function createEventMarkerData(
  event: EventIntegrationData,
  userLat: number,
  userLng: number,
): {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  distanceMeters: number;
  heatLevel: HeatLevelValue;
} {
  return {
    id: event.eventId,
    lat: event.lat,
    lng: event.lng,
    title: event.name,
    subtitle: `${event.category} • ${event.venue}`,
    distanceMeters: haversineDistance(userLat, userLng, event.lat, event.lng),
    heatLevel: calculateEventHeatLevel(event.attendeeCount, 0, event.isActive),
  };
}

/* ==== Event notification text ==== */

export function generateEventNotificationText(
  event: EventIntegrationData,
  type: "starting" | "nearby" | "popular" | "new",
): { title: string; body: string } {
  switch (type) {
    case "starting":
      return {
        title: `🎉 ${event.name}`,
        body: `Começando em breve em ${event.venue}`,
      };
    case "nearby":
      return {
        title: `Evento próximo: ${event.name}`,
        body: `${event.category} em ${event.venue} • ${event.attendeeCount} confirmados`,
      };
    case "popular":
      return {
        title: `🔥 ${event.name}`,
        body: `Bombando com ${event.attendeeCount} pessoas em ${event.venue}`,
      };
    case "new":
      return {
        title: `📅 Novo evento: ${event.name}`,
        body: `${event.category} em ${event.venue}`,
      };
  }
}
