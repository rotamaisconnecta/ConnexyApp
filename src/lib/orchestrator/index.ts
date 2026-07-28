/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — Barrel Export
========================================================== */

export {
  ConnexyOrchestrator,
  type ModuleSyncCallback,
  type RegisteredModule,
} from "./orchestrator";

export {
  SyncEvent,
  type SyncEventValue,
  type SyncEventPayload,
  type SyncEventListener,
  type SyncEventSubscription,
  isSyncEvent,
} from "./orchestrator-events";

export {
  OrchestratorPriority,
  type OrchestratorPriorityValue,
  type PrioritizedTask,
  comparePriority,
  isHigherPriority,
  getPriorityLabel,
} from "./orchestrator-priority";

export {
  getCache,
  setCache,
  invalidateCache,
  clearCache,
  invalidateByModule,
  hasCache,
  getCacheStats,
  cleanupExpiredCache,
  generateCacheKey,
  type CacheEntry,
  type CacheStats,
} from "./orchestrator-cache";

export {
  type ModuleState,
  type OrchestratorState,
  type OrchestratorModuleKey,
  MODULE_KEYS,
  createInitialOrchestratorState,
  isModuleKey,
} from "./orchestrator-state";

export {
  SYNC_DEFINITIONS,
  getSyncModulesForLiveEvent,
  getSyncDefinition,
  createLiveToOrchestratorBridge,
  debounceSync,
  cancelPendingSyncs,
  getPendingSyncCount,
  type SyncDefinition,
  type SyncHandler,
} from "./orchestrator-sync";

export {
  useOrchestrator,
  useOrchestratorModule,
  useOrchestratorEvent,
  useOrchestratorSync,
  type UseOrchestratorReturn,
  type UseOrchestratorSyncReturn,
} from "./orchestrator-hooks";
