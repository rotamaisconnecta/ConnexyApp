/* =========================================================
   feed-filter.ts — Pure filter functions
   No React. No side effects. No Supabase.
========================================================= */

import { type FeedItem, type FeedFilterValue, type FeedItemTypeValue } from "./feed-types";

/* ─── filterByType ───────────────────────────────────────── */

export function filterByType(items: FeedItem[], filter: FeedFilterValue): FeedItem[] {
  if (filter === "ALL") return items;
  return items.filter((item) => item.type === filter);
}

/* ─── filterBySearch ─────────────────────────────────────── */

export function filterBySearch(items: FeedItem[], query: string): FeedItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;

  return items.filter((item) => {
    if (item.author.name.toLowerCase().includes(q)) return true;
    if (item.location?.name.toLowerCase().includes(q)) return true;

    const d = item.data;
    if (d.kind === "POST" && d.text.toLowerCase().includes(q)) return true;
    if (d.kind === "MOMENT" && d.text.toLowerCase().includes(q)) return true;
    if (d.kind === "PLACE" && d.name.toLowerCase().includes(q)) return true;
    if (d.kind === "EVENT" && d.name.toLowerCase().includes(q)) return true;
    if (d.kind === "OFFER" && d.title.toLowerCase().includes(q)) return true;
    if (d.kind === "NETWORKING" && d.person.name.toLowerCase().includes(q)) return true;

    return false;
  });
}

/* ─── filterByInterests ──────────────────────────────────── */

export function filterByInterests(items: FeedItem[], interests: string[]): FeedItem[] {
  if (interests.length === 0) return items;
  const lower = interests.map((i) => i.toLowerCase());
  return items.filter((item) => item.interests.some((i) => lower.includes(i.toLowerCase())));
}

/* ─── filterActive ───────────────────────────────────────── */

export function filterActive(items: FeedItem[]): FeedItem[] {
  return items.filter((item) => {
    const d = item.data;
    if (d.kind === "MOMENT") return d.active;
    if (d.kind === "EVENT") return true;
    return true;
  });
}

/* ─── applyFilters ───────────────────────────────────────── */

export function applyFilters(
  items: FeedItem[],
  filter: FeedFilterValue,
  search: string,
): FeedItem[] {
  let result = filterByType(items, filter);
  result = filterBySearch(result, search);
  result = filterActive(result);
  return result;
}
