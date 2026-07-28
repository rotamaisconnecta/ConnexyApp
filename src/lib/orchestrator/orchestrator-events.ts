/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — Event Types
   Pure TypeScript. No React. No side effects.
========================================================== */

export const SyncEvent = {
  SYNC_CONTEXT: "SYNC_CONTEXT",
  SYNC_FEED: "SYNC_FEED",
  SYNC_MAP: "SYNC_MAP",
  SYNC_MARKETPLACE: "SYNC_MARKETPLACE",
  SYNC_DRIVER: "SYNC_DRIVER",
  SYNC_EVENTS: "SYNC_EVENTS",
  SYNC_NOTIFICATIONS: "SYNC_NOTIFICATIONS",
  SYNC_PUBLISHER: "SYNC_PUBLISHER",
  SYNC_ROLES: "SYNC_ROLES",
  SYNC_CACHE: "SYNC_CACHE",
  FULL_REFRESH: "FULL_REFRESH",
} as const;

export type SyncEventValue = (typeof SyncEvent)[keyof typeof SyncEvent];

export interface SyncEventPayload {
  type: SyncEventValue;
  timestamp: number;
  source: string;
  module: SyncEventValue;
  reason?: string;
}

export type SyncEventListener = (payload: SyncEventPayload) => void;

export interface SyncEventSubscription {
  id: string;
  module: SyncEventValue | "*";
  listener: SyncEventListener;
}

export function isSyncEvent(value: string): value is SyncEventValue {
  return Object.values(SyncEvent).includes(value as SyncEventValue);
}
