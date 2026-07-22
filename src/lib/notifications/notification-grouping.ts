/* =========================================================
   notification-grouping.ts — Group notifications by date
   Pure TypeScript. No React. No side effects.
========================================================= */

import { NotificationGroupLabel } from "./notification-types";
import type {
  Notification,
  NotificationGroup,
  NotificationGroupLabelValue,
} from "./notification-types";

/* ─── Date bucket helpers ────────────────────────────────── */

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function isToday(dateStr: string): boolean {
  return toDateKey(dateStr) === toDateKey(new Date().toISOString());
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDateKey(dateStr) === toDateKey(yesterday.toISOString());
}

function getGroupLabel(dateStr: string): NotificationGroupLabelValue {
  if (isToday(dateStr)) return NotificationGroupLabel.TODAY;
  if (isYesterday(dateStr)) return NotificationGroupLabel.YESTERDAY;
  return NotificationGroupLabel.EARLIER;
}

/* ─── Main grouping function ─────────────────────────────── */

export function groupNotifications(items: Notification[]): NotificationGroup[] {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const buckets = new Map<NotificationGroupLabelValue, Notification[]>();

  for (const label of Object.values(NotificationGroupLabel)) {
    buckets.set(label, []);
  }

  for (const item of sorted) {
    const label = getGroupLabel(item.createdAt);
    buckets.get(label)?.push(item);
  }

  const groups: NotificationGroup[] = [];
  for (const [label, items] of buckets) {
    if (items.length > 0) {
      groups.push({ label, items });
    }
  }

  return groups;
}
