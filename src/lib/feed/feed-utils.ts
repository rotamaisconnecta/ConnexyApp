/* =========================================================
   feed-utils.ts — Pure utility functions
   No React. No side effects. No Supabase.
========================================================= */

import type { FeedItem, FeedItemTypeValue } from "./feed-types";

/* ─── formatRelativeTime ─────────────────────────────────── */

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "agora";
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ─── formatRemainingTime ────────────────────────────────── */

export function formatRemainingTime(expiresAt: Date): string {
  const remaining = Math.max(0, expiresAt.getTime() - Date.now());
  const minutes = Math.floor(remaining / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (remaining <= 0) return "Expirado";
  if (minutes < 60) return `${minutes} min`;
  return `${hours} h ${minutes % 60} min`;
}

/* ─── formatDistance ─────────────────────────────────────── */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")}km`;
}

/* ─── formatNumber ───────────────────────────────────────── */

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return String(n);
}

/* ─── groupByType ────────────────────────────────────────── */

export function groupByType(items: FeedItem[]): Map<FeedItemTypeValue, FeedItem[]> {
  const map = new Map<FeedItemTypeValue, FeedItem[]>();
  for (const item of items) {
    const list = map.get(item.type);
    if (list) list.push(item);
    else map.set(item.type, [item]);
  }
  return map;
}

/* ─── getItemTitle ───────────────────────────────────────── */

export function getItemTitle(item: FeedItem): string {
  const d = item.data;
  switch (d.kind) {
    case "POST":
      return `${item.author.name} publicou`;
    case "MOMENT":
      return `${item.author.name} está aqui`;
    case "PLACE":
      return d.name;
    case "EVENT":
      return d.name;
    case "OFFER":
      return d.title;
    case "ROUTE":
      return `${d.origin} → ${d.destination}`;
    case "NETWORKING":
      return d.person.name;
  }
}
