/* =========================================================
   notification-types.ts — Notification type definitions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── NotificationCategory ────────────────────────────────── */

export const NotificationCategory = {
  MESSAGE: "MESSAGE",
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTION_ACCEPTED: "CONNECTION_ACCEPTED",
  NEARBY_PERSON: "NEARBY_PERSON",
  NEARBY_MOMENT: "NEARBY_MOMENT",
  NEARBY_OFFER: "NEARBY_OFFER",
  NEARBY_EVENT: "NEARBY_EVENT",
  DRIVER_FOUND: "DRIVER_FOUND",
  RIDE_STARTED: "RIDE_STARTED",
  RIDE_FINISHED: "RIDE_FINISHED",
  BUSINESS_FOLLOW: "BUSINESS_FOLLOW",
  COUPON_AVAILABLE: "COUPON_AVAILABLE",
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  MENTION: "MENTION",
  SHARE: "SHARE",
} as const;

export type NotificationCategoryValue =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];

/* ─── NotificationPriority ────────────────────────────────── */

export const NotificationPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type NotificationPriorityValue =
  (typeof NotificationPriority)[keyof typeof NotificationPriority];

/* ─── NotificationGroupLabel ──────────────────────────────── */

export const NotificationGroupLabel = {
  TODAY: "TODAY",
  YESTERDAY: "YESTERDAY",
  EARLIER: "EARLIER",
} as const;

export type NotificationGroupLabelValue =
  (typeof NotificationGroupLabel)[keyof typeof NotificationGroupLabel];

/* ─── Notification ────────────────────────────────────────── */

export interface Notification {
  id: string;
  category: NotificationCategoryValue;
  priority: NotificationPriorityValue;
  title: string;
  body: string;
  actorName?: string;
  actorAvatar?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
}

/* ─── NotificationGroup ───────────────────────────────────── */

export interface NotificationGroup {
  label: NotificationGroupLabelValue;
  items: Notification[];
}

/* ─── NotificationFilter ──────────────────────────────────── */

export interface NotificationFilterState {
  categories: NotificationCategoryValue[];
  unreadOnly: boolean;
  search: string;
}

/* ─── NotificationSettings ────────────────────────────────── */

export interface NotificationSettingsState {
  message: boolean;
  connectionRequest: boolean;
  connectionAccepted: boolean;
  nearbyPerson: boolean;
  nearbyMoment: boolean;
  nearbyOffer: boolean;
  nearbyEvent: boolean;
  driverFound: boolean;
  rideStarted: boolean;
  rideFinished: boolean;
  businessFollow: boolean;
  couponAvailable: boolean;
  like: boolean;
  comment: boolean;
  mention: boolean;
  share: boolean;
}
