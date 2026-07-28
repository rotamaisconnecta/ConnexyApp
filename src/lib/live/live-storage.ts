/* ============================================================
   CONNEXY
   Phase 8.5
   Live Ecosystem — Storage
   Persists recent events in localStorage for replay.
   No React. No side effects on import.
=========================================================== */

import type { LiveEvent, LiveEventTypeValue } from "./live-events";

/* ─── Constants ──────────────────────────────────────────── */

const STORAGE_KEY = "connexy_live_events";
const MAX_STORED = 50;

/* ─── Read ───────────────────────────────────────────────── */

export function getStoredLiveEvents(): LiveEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LiveEvent[];
  } catch {
    return [];
  }
}

export function getStoredLiveEventsByType(type: LiveEventTypeValue): LiveEvent[] {
  return getStoredLiveEvents().filter((e) => e.type === type);
}

/* ─── Write ──────────────────────────────────────────────── */

export function storeLiveEvent(event: LiveEvent): void {
  try {
    const events = getStoredLiveEvents();
    events.push(event);
    const trimmed = events.slice(-MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be unavailable or full
  }
}

export function storeLiveEvents(events: LiveEvent[]): void {
  try {
    const existing = getStoredLiveEvents();
    const merged = [...existing, ...events].slice(-MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage may be unavailable or full
  }
}

/* ─── Clear ──────────────────────────────────────────────── */

export function clearStoredLiveEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/* ─── Stats ──────────────────────────────────────────────── */

export function getStoredEventCount(): number {
  return getStoredLiveEvents().length;
}
