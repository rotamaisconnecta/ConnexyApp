/* =========================================================
   notification-actions.ts — State mutation helpers for
   notifications. Pure TypeScript. No React. No side effects.
========================================================= */

import type { Notification } from "./notification-types";

/* ─── Mark as read ───────────────────────────────────────── */

export function markAsRead(items: Notification[], id: string): Notification[] {
  return items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
}

/* ─── Mark all as read ───────────────────────────────────── */

export function markAllAsRead(items: Notification[]): Notification[] {
  return items.map((n) => ({ ...n, isRead: true }));
}

/* ─── Remove notification ────────────────────────────────── */

export function removeNotification(items: Notification[], id: string): Notification[] {
  return items.filter((n) => n.id !== id);
}

/* ─── Add notification (prepend) ─────────────────────────── */

export function addNotification(items: Notification[], notification: Notification): Notification[] {
  return [notification, ...items];
}
