/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — State
   Central state interface and initial state.
   Pure TypeScript. No React. No side effects.
========================================================== */

export interface ModuleState {
  lastSync: number;
  syncCount: number;
  error: string | null;
  pending: boolean;
}

export interface OrchestratorState {
  context: ModuleState;
  feed: ModuleState;
  notifications: ModuleState;
  marketplace: ModuleState;
  events: ModuleState;
  driver: ModuleState;
  publisher: ModuleState;
  map: ModuleState;
  roles: ModuleState;
  live: ModuleState;
  cache: ModuleState;
  lastSync: number;
  online: boolean;
  initialized: boolean;
}

const createInitialModuleState = (): ModuleState => ({
  lastSync: 0,
  syncCount: 0,
  error: null,
  pending: false,
});

export function createInitialOrchestratorState(): OrchestratorState {
  return {
    context: createInitialModuleState(),
    feed: createInitialModuleState(),
    notifications: createInitialModuleState(),
    marketplace: createInitialModuleState(),
    events: createInitialModuleState(),
    driver: createInitialModuleState(),
    publisher: createInitialModuleState(),
    map: createInitialModuleState(),
    roles: createInitialModuleState(),
    live: createInitialModuleState(),
    cache: createInitialModuleState(),
    lastSync: 0,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    initialized: false,
  };
}

export type OrchestratorModuleKey = keyof Omit<
  OrchestratorState,
  "lastSync" | "online" | "initialized"
>;

export const MODULE_KEYS: OrchestratorModuleKey[] = [
  "context",
  "feed",
  "notifications",
  "marketplace",
  "events",
  "driver",
  "publisher",
  "map",
  "roles",
  "live",
  "cache",
];

export function isModuleKey(key: string): key is OrchestratorModuleKey {
  return MODULE_KEYS.includes(key as OrchestratorModuleKey);
}
