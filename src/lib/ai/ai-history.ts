/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — History Engine
   Records user interactions locally.
   Prepared for Supabase migration.
   Pure TypeScript. No React. No side effects.
============================================================ */

import type { AIHistoryEntry, AIHistoryActionValue, AIEntityTypeValue } from "./ai-types";

/* ─── Constants ─────────────────────────────────────────── */

const STORAGE_KEY = "connexy:ai:history";
const MAX_ENTRIES = 5000;
const MAX_AGE_DAYS = 90;

/* ─── History State ─────────────────────────────────────── */

let historyCache: AIHistoryEntry[] | null = null;

/* ─── Core ──────────────────────────────────────────────── */

export function recordAction(
  entityId: string,
  entityType: AIEntityTypeValue,
  action: AIHistoryActionValue,
  metadata?: Record<string, unknown>,
): void {
  const entry: AIHistoryEntry = {
    entityId,
    entityType,
    action,
    timestamp: Date.now(),
    metadata,
  };

  const history = loadHistory();
  history.unshift(entry);

  if (history.length > MAX_ENTRIES) {
    history.splice(MAX_ENTRIES);
  }

  saveHistory(history);
}

/* ─── Getters ───────────────────────────────────────────── */

export function getHistory(): AIHistoryEntry[] {
  return loadHistory();
}

export function getHistoryForEntity(entityId: string): AIHistoryEntry[] {
  return loadHistory().filter((e) => e.entityId === entityId);
}

export function getHistoryForType(entityType: AIEntityTypeValue): AIHistoryEntry[] {
  return loadHistory().filter((e) => e.entityType === entityType);
}

export function getHistoryForAction(action: AIHistoryActionValue): AIHistoryEntry[] {
  return loadHistory().filter((e) => e.action === action);
}

/* ─── Aggregation ───────────────────────────────────────── */

export function getEntityInteractionCount(entityId: string): number {
  return loadHistory().filter((e) => e.entityId === entityId).length;
}

export function getTotalInteractions(): number {
  return loadHistory().length;
}

export function getEntityCountMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of loadHistory()) {
    map.set(entry.entityId, (map.get(entry.entityId) ?? 0) + 1);
  }
  return map;
}

export function getTypeCountMap(): Map<AIEntityTypeValue, number> {
  const map = new Map<AIEntityTypeValue, number>();
  for (const entry of loadHistory()) {
    map.set(entry.entityType, (map.get(entry.entityType) ?? 0) + 1);
  }
  return map;
}

/* ─── Cleanup ───────────────────────────────────────────── */

export function cleanupOldHistory(): number {
  const history = loadHistory();
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const before = history.length;
  const cleaned = history.filter((e) => e.timestamp >= cutoff);
  saveHistory(cleaned);
  return before - cleaned.length;
}

export function clearHistory(): void {
  historyCache = null;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* ─── Storage ───────────────────────────────────────────── */

function loadHistory(): AIHistoryEntry[] {
  if (historyCache) return historyCache;

  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      historyCache = [];
      return historyCache;
    }
    const parsed = JSON.parse(raw) as AIHistoryEntry[];
    historyCache = Array.isArray(parsed) ? parsed : [];
    return historyCache;
  } catch {
    historyCache = [];
    return historyCache;
  }
}

function saveHistory(history: AIHistoryEntry[]): void {
  historyCache = history;

  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/* ─── Invalidate Cache ──────────────────────────────────── */

export function invalidateHistoryCache(): void {
  historyCache = null;
}
