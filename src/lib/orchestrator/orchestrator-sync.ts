/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — Sync
   Module synchronization functions.
   Uses Live Engine and Event Bus for coordination.
   Pure TypeScript. No React. No side effects.
========================================================== */

import type { LiveEvent, LiveEventTypeValue } from "@/lib/live/live-events";
import { LiveEventType } from "@/lib/live/live-events";
import { subscribeLiveEvent } from "@/lib/live/live-engine";
import type { SyncEventValue } from "./orchestrator-events";
import { SyncEvent } from "./orchestrator-events";
import type { OrchestratorPriorityValue } from "./orchestrator-priority";
import { OrchestratorPriority } from "./orchestrator-priority";
import type { OrchestratorModuleKey } from "./orchestrator-state";

/* ─── Sync Definitions ────────────────────────────────────── */

export interface SyncDefinition {
  module: OrchestratorModuleKey;
  syncEvent: SyncEventValue;
  priority: OrchestratorPriorityValue;
  triggers: LiveEventTypeValue[];
  debounceMs: number;
}

export const SYNC_DEFINITIONS: SyncDefinition[] = [
  {
    module: "context",
    syncEvent: SyncEvent.SYNC_CONTEXT,
    priority: OrchestratorPriority.HIGH,
    triggers: [
      LiveEventType.CHECKIN_CREATED,
      LiveEventType.USER_ENTER_AREA,
      LiveEventType.USER_EXIT_AREA,
      LiveEventType.DRIVER_ONLINE,
      LiveEventType.DRIVER_OFFLINE,
    ],
    debounceMs: 1000,
  },
  {
    module: "feed",
    syncEvent: SyncEvent.SYNC_FEED,
    priority: OrchestratorPriority.NORMAL,
    triggers: [
      LiveEventType.PHOTO_CREATED,
      LiveEventType.VIDEO_CREATED,
      LiveEventType.TEXT_CREATED,
      LiveEventType.MOMENT_CREATED,
      LiveEventType.REEL_CREATED,
      LiveEventType.EVENT_CREATED,
      LiveEventType.PLACE_CREATED,
      LiveEventType.OFFER_CREATED,
      LiveEventType.CHECKIN_CREATED,
      LiveEventType.DRIVER_ONLINE,
      LiveEventType.DRIVER_OFFLINE,
      LiveEventType.USER_ENTER_AREA,
      LiveEventType.USER_EXIT_AREA,
      LiveEventType.BUSINESS_ONLINE,
    ],
    debounceMs: 500,
  },
  {
    module: "map",
    syncEvent: SyncEvent.SYNC_MAP,
    priority: OrchestratorPriority.HIGH,
    triggers: [
      LiveEventType.CHECKIN_CREATED,
      LiveEventType.DRIVER_ONLINE,
      LiveEventType.DRIVER_OFFLINE,
      LiveEventType.USER_ENTER_AREA,
      LiveEventType.USER_EXIT_AREA,
      LiveEventType.EVENT_CREATED,
      LiveEventType.PLACE_CREATED,
    ],
    debounceMs: 1500,
  },
  {
    module: "marketplace",
    syncEvent: SyncEvent.SYNC_MARKETPLACE,
    priority: OrchestratorPriority.NORMAL,
    triggers: [
      LiveEventType.OFFER_CREATED,
      LiveEventType.PLACE_CREATED,
      LiveEventType.BUSINESS_ONLINE,
    ],
    debounceMs: 2000,
  },
  {
    module: "driver",
    syncEvent: SyncEvent.SYNC_DRIVER,
    priority: OrchestratorPriority.HIGH,
    triggers: [
      LiveEventType.DRIVER_ONLINE,
      LiveEventType.DRIVER_OFFLINE,
      LiveEventType.RIDE_CREATED,
    ],
    debounceMs: 1000,
  },
  {
    module: "events",
    syncEvent: SyncEvent.SYNC_EVENTS,
    priority: OrchestratorPriority.NORMAL,
    triggers: [
      LiveEventType.EVENT_CREATED,
      LiveEventType.USER_ENTER_AREA,
      LiveEventType.USER_EXIT_AREA,
    ],
    debounceMs: 2000,
  },
  {
    module: "notifications",
    syncEvent: SyncEvent.SYNC_NOTIFICATIONS,
    priority: OrchestratorPriority.LOW,
    triggers: [
      LiveEventType.PHOTO_CREATED,
      LiveEventType.VIDEO_CREATED,
      LiveEventType.MOMENT_CREATED,
      LiveEventType.REEL_CREATED,
      LiveEventType.EVENT_CREATED,
      LiveEventType.OFFER_CREATED,
      LiveEventType.RIDE_CREATED,
      LiveEventType.PLACE_CREATED,
    ],
    debounceMs: 3000,
  },
  {
    module: "publisher",
    syncEvent: SyncEvent.SYNC_PUBLISHER,
    priority: OrchestratorPriority.NORMAL,
    triggers: [
      LiveEventType.PHOTO_CREATED,
      LiveEventType.VIDEO_CREATED,
      LiveEventType.TEXT_CREATED,
      LiveEventType.MOMENT_CREATED,
      LiveEventType.REEL_CREATED,
    ],
    debounceMs: 1000,
  },
  {
    module: "roles",
    syncEvent: SyncEvent.SYNC_ROLES,
    priority: OrchestratorPriority.HIGH,
    triggers: [
      LiveEventType.DRIVER_ONLINE,
      LiveEventType.DRIVER_OFFLINE,
      LiveEventType.BUSINESS_ONLINE,
    ],
    debounceMs: 3000,
  },
  {
    module: "live",
    syncEvent: SyncEvent.SYNC_CACHE,
    priority: OrchestratorPriority.BACKGROUND,
    triggers: [],
    debounceMs: 5000,
  },
];

/* ─── Live-to-Sync Mapping ────────────────────────────────── */

export function getSyncModulesForLiveEvent(liveEventType: LiveEventTypeValue): SyncDefinition[] {
  return SYNC_DEFINITIONS.filter((def) => def.triggers.includes(liveEventType));
}

export function getSyncDefinition(module: OrchestratorModuleKey): SyncDefinition | undefined {
  return SYNC_DEFINITIONS.find((def) => def.module === module);
}

/* ─── Live Event → Orchestrator Bridge ────────────────────── */

export type SyncHandler = (definition: SyncDefinition, event: LiveEvent) => void | Promise<void>;

let bridgeUnsubscribers: (() => void)[] = [];

export function createLiveToOrchestratorBridge(handler: SyncHandler): () => void {
  for (const definition of SYNC_DEFINITIONS) {
    for (const triggerType of definition.triggers) {
      const unsub = subscribeLiveEvent(triggerType, (event) => {
        handler(definition, event);
      });
      bridgeUnsubscribers.push(unsub);
    }
  }

  return () => {
    for (const unsub of bridgeUnsubscribers) unsub();
    bridgeUnsubscribers = [];
  };
}

/* ─── Debounced Sync Tracking ─────────────────────────────── */

const pendingSyncs: Map<string, ReturnType<typeof setTimeout>> = new Map();

export function debounceSync(key: string, fn: () => void, debounceMs: number): void {
  const existing = pendingSyncs.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingSyncs.delete(key);
    fn();
  }, debounceMs);

  pendingSyncs.set(key, timer);
}

export function cancelPendingSyncs(): void {
  for (const timer of pendingSyncs.values()) clearTimeout(timer);
  pendingSyncs.clear();
}

export function getPendingSyncCount(): number {
  return pendingSyncs.size;
}
