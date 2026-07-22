/* ==== integration-feed.ts -- Feed integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  IntegrationTargetValue,
  IntegrationFeedItem,
} from "./integration-types";
import { IntegrationAction, IntegrationTarget } from "./integration-types";
import { generateIntegrationId, sortByDate } from "./integration-utils";

/* ==== Feed item creation from integration events ==== */

export function createFeedItemFromEvent(event: IntegrationEvent): IntegrationFeedItem | null {
  if (event.action === IntegrationAction.EVENT_CREATED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "event" }>;
    return {
      id: generateIntegrationId("feed"),
      source: IntegrationTarget.EVENTS,
      type: "EVENT",
      title: p.eventName,
      subtitle: `${p.venue} • ${p.category}`,
      timestamp: event.timestamp,
      priority: 10,
      actionUrl: `/events/${p.eventId}`,
    };
  }
  return null;
}

export function createFeedItemFromCheckin(event: IntegrationEvent): IntegrationFeedItem | null {
  if (event.action === IntegrationAction.CHECKIN_CREATED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "checkin" }>;
    return {
      id: generateIntegrationId("feed"),
      source: IntegrationTarget.CHECKIN,
      type: "MOMENT",
      title: `${p.userName} fez check-in`,
      subtitle: p.placeName ?? p.eventName,
      timestamp: event.timestamp,
      priority: 8,
      actionUrl: `/events/${p.eventId}`,
    };
  }
  return null;
}

export function createFeedItemFromReel(event: IntegrationEvent): IntegrationFeedItem | null {
  if (event.action === IntegrationAction.REEL_POSTED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "reel" }>;
    return {
      id: generateIntegrationId("feed"),
      source: IntegrationTarget.REELS,
      type: "REEL",
      title: `${p.authorName} postou um reel`,
      subtitle: p.locationName ?? p.category,
      timestamp: event.timestamp,
      priority: 7,
      actionUrl: `/reels/${p.reelId}`,
    };
  }
  return null;
}

export function createFeedItemFromOffer(event: IntegrationEvent): IntegrationFeedItem | null {
  if (event.action === IntegrationAction.OFFER_CREATED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "offer" }>;
    return {
      id: generateIntegrationId("feed"),
      source: IntegrationTarget.MARKETPLACE,
      type: "OFFER",
      title: p.title,
      subtitle: `${p.businessName} • -${p.discountPercent}%`,
      timestamp: event.timestamp,
      priority: 9,
      actionUrl: `/marketplace/${p.businessId}`,
    };
  }
  return null;
}

export function createFeedItemFromMoment(event: IntegrationEvent): IntegrationFeedItem | null {
  if (event.action === IntegrationAction.MOMENT_POSTED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "moment" }>;
    return {
      id: generateIntegrationId("feed"),
      source: IntegrationTarget.MOMENTS,
      type: "MOMENT",
      title: `${p.userName} compartilhou um momento`,
      subtitle: p.placeName ?? p.text.slice(0, 50),
      timestamp: event.timestamp,
      priority: 6,
      actionUrl: `/profile/${p.userId}`,
    };
  }
  return null;
}

export function createFeedItemFromDriver(event: IntegrationEvent): IntegrationFeedItem | null {
  if (event.action === IntegrationAction.DRIVER_ONLINE) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "driver" }>;
    return {
      id: generateIntegrationId("feed"),
      source: IntegrationTarget.DRIVER,
      type: "NETWORKING",
      title: `${p.driverName} está online`,
      subtitle: `${p.vehicle} • ${p.serviceArea}`,
      timestamp: event.timestamp,
      priority: 4,
      actionUrl: `/driver/${p.driverId}`,
    };
  }
  return null;
}

/* ==== Main feed item dispatcher ==== */

export function createFeedItem(event: IntegrationEvent): IntegrationFeedItem | null {
  switch (event.action) {
    case IntegrationAction.EVENT_CREATED:
      return createFeedItemFromEvent(event);
    case IntegrationAction.CHECKIN_CREATED:
      return createFeedItemFromCheckin(event);
    case IntegrationAction.REEL_POSTED:
      return createFeedItemFromReel(event);
    case IntegrationAction.OFFER_CREATED:
      return createFeedItemFromOffer(event);
    case IntegrationAction.MOMENT_POSTED:
      return createFeedItemFromMoment(event);
    case IntegrationAction.DRIVER_ONLINE:
      return createFeedItemFromDriver(event);
    default:
      return null;
  }
}

/* ==== Feed batch processing ==== */

export function processEventsToFeedItems(events: IntegrationEvent[]): IntegrationFeedItem[] {
  const items = events
    .map(createFeedItem)
    .filter((item): item is IntegrationFeedItem => item !== null);
  return sortByDate(items, "desc");
}

/* ==== Feed filtering by source ==== */

export function filterFeedBySource(
  items: IntegrationFeedItem[],
  source: IntegrationTargetValue,
): IntegrationFeedItem[] {
  return items.filter((item) => item.source === source);
}

export function filterFeedByType(
  items: IntegrationFeedItem[],
  type: string,
): IntegrationFeedItem[] {
  return items.filter((item) => item.type === type);
}

/* ==== Feed priority scoring ==== */

export function scoreFeedItem(item: IntegrationFeedItem): number {
  let score = item.priority;

  const age = Date.now() - new Date(item.timestamp).getTime();
  const ageHours = age / 3600000;

  if (ageHours < 1) score += 5;
  else if (ageHours < 6) score += 3;
  else if (ageHours < 24) score += 1;
  else score -= 2;

  return Math.max(0, score);
}

export function rankFeedItems(items: IntegrationFeedItem[]): IntegrationFeedItem[] {
  return [...items]
    .map((item) => ({ item, score: scoreFeedItem(item) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

/* ==== Feed content generation from events ==== */

export function generateFeedContent(event: IntegrationEvent): {
  text: string;
  emoji: string;
} | null {
  switch (event.action) {
    case IntegrationAction.EVENT_CREATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "event" }>;
      return {
        text: `Novo evento: ${p.eventName} em ${p.venue}`,
        emoji: "📅",
      };
    }
    case IntegrationAction.CHECKIN_CREATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "checkin" }>;
      const action =
        p.transition === "CHECKED_IN"
          ? "chegou em"
          : p.transition === "LEFT_EVENT"
            ? "saiu de"
            : "está indo para";
      return {
        text: `${p.userName} ${action} ${p.placeName ?? p.eventName}`,
        emoji: "📍",
      };
    }
    case IntegrationAction.REEL_POSTED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "reel" }>;
      return {
        text: `${p.authorName} postou um reel${p.locationName ? ` em ${p.locationName}` : ""}`,
        emoji: "🎬",
      };
    }
    case IntegrationAction.OFFER_CREATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "offer" }>;
      return {
        text: `Nova oferta: ${p.title} (${p.discountPercent}% off) em ${p.businessName}`,
        emoji: "🏷️",
      };
    }
    case IntegrationAction.MOMENT_POSTED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "moment" }>;
      return {
        text: `${p.userName} compartilhou: "${p.text.slice(0, 60)}${p.text.length > 60 ? "..." : ""}"`,
        emoji: "✨",
      };
    }
    case IntegrationAction.DRIVER_ONLINE: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "driver" }>;
      return {
        text: `${p.driverName} está disponível em ${p.serviceArea}`,
        emoji: "🚗",
      };
    }
    default:
      return null;
  }
}
