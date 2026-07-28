/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — Core
   Central kernel for all module communication.
   No module should know another directly.
   Pure TypeScript. No React. No side effects.
========================================================== */

import type { LiveEvent, LiveEventTypeValue } from "@/lib/live/live-events";
import { subscribeLiveEvent } from "@/lib/live/live-engine";
import type { SyncEventValue, SyncEventListener } from "./orchestrator-events";
import { SyncEvent } from "./orchestrator-events";
import type { OrchestratorPriorityValue } from "./orchestrator-priority";
import { OrchestratorPriority } from "./orchestrator-priority";
import {
  createInitialOrchestratorState,
  type OrchestratorState,
  type OrchestratorModuleKey,
  MODULE_KEYS,
} from "./orchestrator-state";
import {
  getCache,
  setCache,
  invalidateCache,
  invalidateByModule,
  generateCacheKey,
  cleanupExpiredCache,
} from "./orchestrator-cache";
import {
  SYNC_DEFINITIONS,
  createLiveToOrchestratorBridge,
  debounceSync,
  cancelPendingSyncs,
  type SyncHandler,
} from "./orchestrator-sync";

/* ─── Logger ──────────────────────────────────────────────── */

const IS_DEV = import.meta.env.DEV;

function logGroup(label: string, fn: () => void): void {
  if (!IS_DEV) return;
  console.group(`%c[Orchestrator] ${label}`, "color: #6366f1; font-weight: bold");
  fn();
  console.groupEnd();
}

function logInfo(msg: string, ...args: unknown[]): void {
  if (!IS_DEV) return;
  console.log(`%c[Orchestrator] ${msg}`, "color: #818cf8", ...args);
}

function logWarn(msg: string, ...args: unknown[]): void {
  if (!IS_DEV) return;
  console.warn(`%c[Orchestrator] ${msg}`, "color: #f59e0b", ...args);
}

/* ─── Types ───────────────────────────────────────────────── */

export type ModuleSyncCallback = (
  event: LiveEvent,
  module: OrchestratorModuleKey,
) => void | Promise<void>;

export interface RegisteredModule {
  key: OrchestratorModuleKey;
  onSync: ModuleSyncCallback;
  priority: OrchestratorPriorityValue;
}

/* ─── Orchestrator Class ──────────────────────────────────── */

class ConnexyOrchestratorCore {
  private state: OrchestratorState;
  private modules: Map<OrchestratorModuleKey, RegisteredModule>;
  private syncListeners: Map<SyncEventValue | "*", SyncEventListener[]>;
  private liveUnsubscriber: (() => void) | null;
  private stateListeners: Set<(state: OrchestratorState) => void>;
  private refreshTimers: Map<string, ReturnType<typeof setTimeout>>;
  private syncQueue: Array<{ module: OrchestratorModuleKey; priority: OrchestratorPriorityValue }>;

  constructor() {
    this.state = createInitialOrchestratorState();
    this.modules = new Map();
    this.syncListeners = new Map();
    this.liveUnsubscriber = null;
    this.stateListeners = new Set();
    this.refreshTimers = new Map();
    this.syncQueue = [];
  }

  /* ─── Lifecycle ─────────────────────────────────────────── */

  initialize(): void {
    if (this.state.initialized) {
      logWarn("Already initialized");
      return;
    }

    logGroup("initialize()", () => {
      this.setupOnlineListener();
      this.setupLiveBridge();
      this.startCacheCleanup();
      this.state.initialized = true;
      this.state.lastSync = Date.now();
      logInfo("Initialized with", this.modules.size, "registered modules");
    });

    this.emit();
  }

  shutdown(): void {
    logGroup("shutdown()", () => {
      this.liveUnsubscriber?.();
      this.liveUnsubscriber = null;
      cancelPendingSyncs();
      for (const timer of this.refreshTimers.values()) clearTimeout(timer);
      this.refreshTimers.clear();
      this.modules.clear();
      this.syncListeners.clear();
      this.stateListeners.clear();
      this.syncQueue = [];
      logInfo("Shutdown complete");
    });

    this.state = createInitialOrchestratorState();
    this.emit();
  }

  /* ─── Module Registration ───────────────────────────────── */

  registerModule(
    key: OrchestratorModuleKey,
    onSync: ModuleSyncCallback,
    priority: OrchestratorPriorityValue = OrchestratorPriority.NORMAL,
  ): void {
    if (this.modules.has(key)) {
      logWarn(`Module "${key}" already registered, overwriting`);
    }

    this.modules.set(key, { key, onSync, priority });
    logInfo(`Module "${key}" registered (priority: ${priority})`);
  }

  unregisterModule(key: OrchestratorModuleKey): void {
    if (!this.modules.has(key)) {
      logWarn(`Module "${key}" not registered`);
      return;
    }

    this.modules.delete(key);
    invalidateByModule(key);
    logInfo(`Module "${key}" unregistered`);
  }

  /* ─── Dispatch ──────────────────────────────────────────── */

  dispatch(event: LiveEvent): void {
    const definitions = SYNC_DEFINITIONS.filter((def) => def.triggers.includes(event.type));

    if (definitions.length === 0) return;

    logGroup(`dispatch(${event.type})`, () => {
      for (const def of definitions) {
        const module = this.modules.get(def.module);
        if (!module) continue;

        debounceSync(
          `${def.module}:${event.type}`,
          () => this.executeModuleSync(module, event, def.priority),
          def.debounceMs,
        );
      }
    });

    this.emitSyncEvent(SyncEvent.FULL_REFRESH, event.source, event.type);
  }

  dispatchPriority(event: LiveEvent, priority: OrchestratorPriorityValue): void {
    const definitions = SYNC_DEFINITIONS.filter(
      (def) => def.triggers.includes(event.type) && def.priority <= priority,
    );

    for (const def of definitions) {
      const module = this.modules.get(def.module);
      if (!module) continue;

      this.executeModuleSync(module, event, priority);
    }
  }

  /* ─── Refresh ───────────────────────────────────────────── */

  refresh(module: OrchestratorModuleKey): void {
    const existing = this.refreshTimers.get(module);
    if (existing) clearTimeout(existing);

    this.refreshTimers.set(
      module,
      setTimeout(() => {
        this.refreshTimers.delete(module);
        this.refreshModule(module);
      }, 300),
    );
  }

  refreshModule(module: OrchestratorModuleKey): void {
    const registered = this.modules.get(module);
    if (!registered) {
      logWarn(`Cannot refresh unregistered module "${module}"`);
      return;
    }

    this.updateModuleState(module, { pending: true });

    const syncEvent: LiveEvent = {
      id: `orch-refresh-${module}-${Date.now()}`,
      type: "TEXT_CREATED" as LiveEventTypeValue,
      timestamp: Date.now(),
      source: "orchestrator",
      payload: { text: `refresh:${module}` } as never,
    };

    try {
      registered.onSync(syncEvent, module);
      this.updateModuleState(module, {
        pending: false,
        lastSync: Date.now(),
        syncCount: this.state[module].syncCount + 1,
        error: null,
      });
    } catch (err) {
      this.updateModuleState(module, {
        pending: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    this.emit();
  }

  refreshEverything(): void {
    logInfo("refreshEverything()");

    for (const key of MODULE_KEYS) {
      this.refreshModule(key);
    }
  }

  /* ─── Cache ─────────────────────────────────────────────── */

  getCache<T = unknown>(key: string): T | null {
    return getCache<T>(key);
  }

  setCache<T = unknown>(key: string, value: T, module: string, ttlMs?: number): void {
    setCache(key, value, module, ttlMs);
  }

  invalidateCache(key: string): boolean {
    return invalidateCache(key);
  }

  invalidateModuleCache(module: OrchestratorModuleKey): number {
    return invalidateByModule(module);
  }

  /* ─── Listeners ─────────────────────────────────────────── */

  addSyncListener(event: SyncEventValue | "*", listener: SyncEventListener): () => void {
    const existing = this.syncListeners.get(event) ?? [];
    existing.push(listener);
    this.syncListeners.set(event, existing);

    return () => {
      const list = this.syncListeners.get(event);
      if (!list) return;
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  addStateListener(listener: (state: OrchestratorState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /* ─── Getters ───────────────────────────────────────────── */

  getState(): OrchestratorState {
    return { ...this.state };
  }

  isOnline(): boolean {
    return this.state.online;
  }

  getLastSync(): number {
    return this.state.lastSync;
  }

  getModuleState(module: OrchestratorModuleKey): OrchestratorState[OrchestratorModuleKey] {
    return { ...this.state[module] };
  }

  /* ─── Internal ──────────────────────────────────────────── */

  private executeModuleSync(
    module: RegisteredModule,
    event: LiveEvent,
    priority: OrchestratorPriorityValue,
  ): void {
    this.updateModuleState(module.key, { pending: true });

    try {
      module.onSync(event, module.key);
      this.updateModuleState(module.key, {
        pending: false,
        lastSync: Date.now(),
        syncCount: this.state[module.key].syncCount + 1,
        error: null,
      });
    } catch (err) {
      this.updateModuleState(module.key, {
        pending: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    this.emit();
  }

  private updateModuleState(
    module: OrchestratorModuleKey,
    partial: Partial<OrchestratorState[OrchestratorModuleKey]>,
  ): void {
    this.state[module] = { ...this.state[module], ...partial };
  }

  private emitSyncEvent(type: SyncEventValue, source: string, reason?: string): void {
    const listeners = [
      ...(this.syncListeners.get(type) ?? []),
      ...(this.syncListeners.get("*") ?? []),
    ];

    for (const listener of listeners) {
      try {
        listener({ type, timestamp: Date.now(), source, module: type, reason });
      } catch {
        // Silently ignore listener errors
      }
    }
  }

  private emit(): void {
    const snapshot = { ...this.state };
    for (const listener of this.stateListeners) {
      try {
        listener(snapshot);
      } catch {
        // Silently ignore listener errors
      }
    }
  }

  private setupOnlineListener(): void {
    if (typeof window === "undefined") return;

    const onOnline = (): void => {
      this.state.online = true;
      logInfo("Online");
      this.emit();
    };

    const onOffline = (): void => {
      this.state.online = false;
      logInfo("Offline");
      this.emit();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
  }

  private setupLiveBridge(): void {
    this.liveUnsubscriber = createLiveToOrchestratorBridge((definition, event) => {
      const module = this.modules.get(definition.module);
      if (!module) return;

      debounceSync(
        `bridge:${definition.module}:${event.type}`,
        () => this.executeModuleSync(module, event, definition.priority),
        definition.debounceMs,
      );
    });

    logInfo("Live-to-Orchestrator bridge established");
  }

  private startCacheCleanup(): void {
    if (typeof window === "undefined") return;

    setInterval(() => {
      const cleaned = cleanupExpiredCache();
      if (cleaned > 0) logInfo(`Cleaned ${cleaned} expired cache entries`);
    }, 60_000);
  }
}

/* ─── Singleton ───────────────────────────────────────────── */

export const ConnexyOrchestrator = new ConnexyOrchestratorCore();
