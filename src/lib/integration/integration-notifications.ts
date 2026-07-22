/* ==== integration-notifications.ts -- Notification generation from integration events
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  GeneratedNotification,
  CheckinTransitionValue,
} from "./integration-types";
import { IntegrationAction, CheckinTransition } from "./integration-types";
import { generateIntegrationId } from "./integration-utils";

/* ==== Notification generation from integration events ==== */

export function generateNotificationsFromEvent(
  event: IntegrationEvent,
  context: {
    friendIds: string[];
    followingIds: string[];
    userLat: number;
    userLng: number;
    favoritePlaceIds: string[];
  },
): GeneratedNotification[] {
  const notifications: GeneratedNotification[] = [];

  switch (event.action) {
    case IntegrationAction.CHECKIN_CREATED:
      notifications.push(
        ...generateCheckinNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "checkin" }>,
          context.friendIds,
        ),
      );
      break;

    case IntegrationAction.DRIVER_ONLINE:
      notifications.push(
        ...generateDriverNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "driver" }>,
          context.userLat,
          context.userLng,
        ),
      );
      break;

    case IntegrationAction.OFFER_CREATED:
      notifications.push(
        ...generateOfferNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "offer" }>,
          context.userLat,
          context.userLng,
        ),
      );
      break;

    case IntegrationAction.EVENT_CREATED:
      notifications.push(
        ...generateEventStartNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "event" }>,
        ),
      );
      break;

    case IntegrationAction.REEL_POSTED:
      notifications.push(
        ...generateReelNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "reel" }>,
          context.followingIds,
        ),
      );
      break;

    case IntegrationAction.MOMENT_POSTED:
      notifications.push(
        ...generateMomentNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "moment" }>,
          context.friendIds,
        ),
      );
      break;

    case IntegrationAction.BUSINESS_UPDATED:
      notifications.push(
        ...generateBusinessNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "business" }>,
        ),
      );
      break;

    case IntegrationAction.PROFILE_UPDATED:
      notifications.push(
        ...generateProfileNotifications(
          event.payload as Extract<IntegrationPayload, { kind: "profile" }>,
        ),
      );
      break;
  }

  return notifications;
}

/* ==== Check-in notifications ==== */

function generateCheckinNotifications(
  payload: Extract<IntegrationPayload, { kind: "checkin" }>,
  friendIds: string[],
): GeneratedNotification[] {
  if (!friendIds.includes(payload.userId)) return [];

  if (payload.transition === CheckinTransition.CHECKED_IN) {
    return [
      {
        id: generateIntegrationId("notif"),
        category: "NEARBY_PERSON",
        priority: "MEDIUM",
        title: `📍 ${payload.userName}`,
        body: `chegou em ${payload.placeName ?? payload.eventName}`,
        actorName: payload.userName,
        metadata: { userId: payload.userId, eventId: payload.eventId },
      },
    ];
  }

  if (payload.transition === CheckinTransition.INTERESTED) {
    return [
      {
        id: generateIntegrationId("notif"),
        category: "NEARBY_EVENT",
        priority: "LOW",
        title: `💡 ${payload.userName}`,
        body: `tem interesse em ${payload.eventName}`,
        actorName: payload.userName,
        metadata: { userId: payload.userId, eventId: payload.eventId },
      },
    ];
  }

  return [];
}

/* ==== Driver notifications ==== */

function generateDriverNotifications(
  payload: Extract<IntegrationPayload, { kind: "driver" }>,
  userLat: number,
  userLng: number,
): GeneratedNotification[] {
  const distance =
    Math.abs(payload.lat - userLat) * 111000 + Math.abs(payload.lng - userLng) * 111000;
  if (distance > 3000) return [];

  return [
    {
      id: generateIntegrationId("notif"),
      category: "DRIVER_FOUND",
      priority: distance < 500 ? "HIGH" : "MEDIUM",
      title: `🚗 Motorista próximo`,
      body: `${payload.driverName} está disponível em ${payload.serviceArea}`,
      metadata: { driverId: payload.driverId, distance },
    },
  ];
}

/* ==== Offer notifications ==== */

function generateOfferNotifications(
  payload: Extract<IntegrationPayload, { kind: "offer" }>,
  userLat: number,
  userLng: number,
): GeneratedNotification[] {
  const distance =
    Math.abs(payload.lat - userLat) * 111000 + Math.abs(payload.lng - userLng) * 111000;
  if (distance > 5000) return [];

  return [
    {
      id: generateIntegrationId("notif"),
      category: "NEARBY_OFFER",
      priority: "MEDIUM",
      title: `🏷️ ${payload.title}`,
      body: `${payload.discountPercent}% off em ${payload.businessName}`,
      imageUrl: undefined,
      metadata: {
        businessId: payload.businessId,
        offerId: payload.offerId,
        distance,
      },
    },
  ];
}

/* ==== Event start notifications ==== */

function generateEventStartNotifications(
  payload: Extract<IntegrationPayload, { kind: "event" }>,
): GeneratedNotification[] {
  return [
    {
      id: generateIntegrationId("notif"),
      category: "NEARBY_EVENT",
      priority: "HIGH",
      title: `🎉 ${payload.eventName}`,
      body: `Começando em breve em ${payload.venue}`,
      metadata: { eventId: payload.eventId, venue: payload.venue },
    },
  ];
}

/* ==== Reel notifications ==== */

function generateReelNotifications(
  payload: Extract<IntegrationPayload, { kind: "reel" }>,
  followingIds: string[],
): GeneratedNotification[] {
  const isFollowing = followingIds.includes(payload.authorId);
  if (!isFollowing) return [];

  return [
    {
      id: generateIntegrationId("notif"),
      category: "LIKE",
      priority: "LOW",
      title: `🎬 ${payload.authorName}`,
      body: `postou um novo reel${payload.locationName ? ` em ${payload.locationName}` : ""}`,
      actorName: payload.authorName,
      metadata: { reelId: payload.reelId },
    },
  ];
}

/* ==== Moment notifications ==== */

function generateMomentNotifications(
  payload: Extract<IntegrationPayload, { kind: "moment" }>,
  friendIds: string[],
): GeneratedNotification[] {
  if (!friendIds.includes(payload.userId)) return [];

  return [
    {
      id: generateIntegrationId("notif"),
      category: "NEARBY_MOMENT",
      priority: "LOW",
      title: `✨ ${payload.userName}`,
      body: `compartilhou um momento${payload.placeName ? ` em ${payload.placeName}` : ""}`,
      actorName: payload.userName,
      metadata: { userId: payload.userId },
    },
  ];
}

/* ==== Business notifications ==== */

function generateBusinessNotifications(
  payload: Extract<IntegrationPayload, { kind: "business" }>,
): GeneratedNotification[] {
  return [
    {
      id: generateIntegrationId("notif"),
      category: "BUSINESS_FOLLOW",
      priority: "LOW",
      title: `🏪 ${payload.businessName}`,
      body: `atualizou suas informações`,
      metadata: { businessId: payload.businessId },
    },
  ];
}

/* ==== Profile notifications ==== */

function generateProfileNotifications(
  payload: Extract<IntegrationPayload, { kind: "profile" }>,
): GeneratedNotification[] {
  return [
    {
      id: generateIntegrationId("notif"),
      category: "CONNECTION_ACCEPTED",
      priority: "LOW",
      title: `👤 Perfil atualizado`,
      body: `${payload.field} foi atualizado`,
      metadata: { userId: payload.userId, field: payload.field },
    },
  ];
}

/* ==== Notification batching ==== */

export function batchNotifications(
  notifications: GeneratedNotification[],
  maxBatchSize = 5,
  windowMs = 60000,
): GeneratedNotification[] {
  const now = Date.now();
  const recent = notifications.filter(
    (n) => now - new Date((n.metadata.timestamp as string) ?? now).getTime() <= windowMs,
  );
  return recent.slice(0, maxBatchSize);
}

/* ==== Notification priority sorting ==== */

export function sortByPriority(notifications: GeneratedNotification[]): GeneratedNotification[] {
  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return [...notifications].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

/* ==== Notification deduplication ==== */

export function deduplicateNotifications(
  notifications: GeneratedNotification[],
): GeneratedNotification[] {
  const seen = new Map<string, GeneratedNotification>();

  for (const notif of notifications) {
    const key = `${notif.category}_${notif.title}_${notif.body}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, notif);
    }
  }

  return Array.from(seen.values());
}

/* ==== Notification conversion to existing format ==== */

export function toNotificationRecord(notif: GeneratedNotification): {
  id: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  actorName?: string;
  actorAvatar?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
  metadata: Record<string, string | number | boolean>;
} {
  return {
    id: notif.id,
    category: notif.category,
    priority: notif.priority,
    title: notif.title,
    body: notif.body,
    actorName: notif.actorName,
    actorAvatar: notif.actorAvatar,
    imageUrl: notif.imageUrl,
    isRead: false,
    createdAt: new Date(),
    metadata: notif.metadata,
  };
}
