/* =========================================================
   notification-ranking.ts — Score-based ranking for
   notifications. Pure TypeScript. No React. No side effects.
========================================================= */

import { NotificationPriority } from "./notification-types";
import type { Notification, NotificationPriorityValue } from "./notification-types";

/* ─── Score weights ──────────────────────────────────────── */

const PRIORITY_SCORE: Record<NotificationPriorityValue, number> = {
  [NotificationPriority.HIGH]: 30,
  [NotificationPriority.MEDIUM]: 20,
  [NotificationPriority.LOW]: 10,
};

const CATEGORY_SCORE: Record<string, number> = {
  MESSAGE: 25,
  CONNECTION_REQUEST: 22,
  DRIVER_FOUND: 21,
  RIDE_STARTED: 20,
  LIKE: 15,
  COMMENT: 14,
  MENTION: 13,
  SHARE: 12,
  COUPON_AVAILABLE: 11,
  NEARBY_PERSON: 10,
  NEARBY_OFFER: 9,
  NEARBY_EVENT: 8,
  NEARBY_MOMENT: 7,
  BUSINESS_FOLLOW: 6,
  CONNECTION_ACCEPTED: 5,
  RIDE_FINISHED: 3,
};

const UNREAD_BONUS = 15;

/* ─── Compute score ──────────────────────────────────────── */

function computeScore(notification: Notification): number {
  let score = 0;

  score += PRIORITY_SCORE[notification.priority] ?? 0;
  score += CATEGORY_SCORE[notification.category] ?? 0;

  if (!notification.isRead) score += UNREAD_BONUS;

  const hoursOld = (Date.now() - new Date(notification.createdAt).getTime()) / 3600000;
  const recencyDecay = Math.max(0, 10 - Math.floor(hoursOld / 6));
  score += recencyDecay;

  return score;
}

/* ─── Rank notifications ─────────────────────────────────── */

export function rankNotifications(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => computeScore(b) - computeScore(a));
}
