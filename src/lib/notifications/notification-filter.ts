/* =========================================================
   notification-filter.ts — Filtering logic for
   notifications. Pure TypeScript. No React. No side effects.
========================================================= */

import type {
  Notification,
  NotificationCategoryValue,
  NotificationFilterState,
} from "./notification-types";

/* ─── Default filter state ───────────────────────────────── */

export function createDefaultFilter(): NotificationFilterState {
  return {
    categories: [],
    unreadOnly: false,
    search: "",
  };
}

/* ─── Filter logic ───────────────────────────────────────── */

export function filterNotifications(
  items: Notification[],
  filter: NotificationFilterState,
): Notification[] {
  let result = items;

  if (filter.categories.length > 0) {
    result = result.filter((n) => filter.categories.includes(n.category));
  }

  if (filter.unreadOnly) {
    result = result.filter((n) => !n.isRead);
  }

  if (filter.search.trim().length > 0) {
    const q = filter.search.toLowerCase().trim();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.actorName?.toLowerCase().includes(q) ?? false),
    );
  }

  return result;
}

/* ─── Toggle category in filter ──────────────────────────── */

export function toggleCategory(
  current: NotificationCategoryValue[],
  target: NotificationCategoryValue,
): NotificationCategoryValue[] {
  if (current.includes(target)) {
    return current.filter((c) => c !== target);
  }
  return [...current, target];
}
