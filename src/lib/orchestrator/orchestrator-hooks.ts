/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — React Hooks
   Hooks for consuming the Orchestrator in React components.
   Pure TypeScript + React.
========================================================== */

import { useState, useEffect, useCallback, useRef } from "react";
import { ConnexyOrchestrator } from "./orchestrator";
import type { OrchestratorState, OrchestratorModuleKey } from "./orchestrator-state";
import type { SyncEventValue, SyncEventPayload } from "./orchestrator-events";
import type { ModuleSyncCallback } from "./orchestrator";
import type { OrchestratorPriorityValue } from "./orchestrator-priority";

/* ─── useOrchestrator ─────────────────────────────────────── */

export interface UseOrchestratorReturn {
  state: OrchestratorState;
  online: boolean;
  lastSync: number;
  refresh: () => void;
  refreshModule: (module: OrchestratorModuleKey) => void;
  dispatch: (event: Parameters<typeof ConnexyOrchestrator.dispatch>[0]) => void;
  registerModule: (
    key: OrchestratorModuleKey,
    onSync: ModuleSyncCallback,
    priority?: OrchestratorPriorityValue,
  ) => void;
  unregisterModule: (key: OrchestratorModuleKey) => void;
  getCache: <T = unknown>(key: string) => T | null;
  setCache: <T = unknown>(key: string, value: T, module: string, ttlMs?: number) => void;
  invalidateCache: (key: string) => void;
}

export function useOrchestrator(): UseOrchestratorReturn {
  const [state, setState] = useState<OrchestratorState>(() => ConnexyOrchestrator.getState());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    return ConnexyOrchestrator.addStateListener((newState) => {
      setState(newState);
    });
  }, []);

  const refresh = useCallback(() => {
    ConnexyOrchestrator.refreshEverything();
  }, []);

  const refreshModule = useCallback((module: OrchestratorModuleKey) => {
    ConnexyOrchestrator.refreshModule(module);
  }, []);

  const dispatch = useCallback((event: Parameters<typeof ConnexyOrchestrator.dispatch>[0]) => {
    ConnexyOrchestrator.dispatch(event);
  }, []);

  const registerModule = useCallback(
    (
      key: OrchestratorModuleKey,
      onSync: ModuleSyncCallback,
      priority?: OrchestratorPriorityValue,
    ) => {
      ConnexyOrchestrator.registerModule(key, onSync, priority);
    },
    [],
  );

  const unregisterModule = useCallback((key: OrchestratorModuleKey) => {
    ConnexyOrchestrator.unregisterModule(key);
  }, []);

  const getCache = useCallback(<T = unknown>(key: string): T | null => {
    return ConnexyOrchestrator.getCache<T>(key);
  }, []);

  const setCache = useCallback(
    <T = unknown>(key: string, value: T, module: string, ttlMs?: number) => {
      ConnexyOrchestrator.setCache(key, value, module, ttlMs);
    },
    [],
  );

  const invalidateCache = useCallback((key: string) => {
    ConnexyOrchestrator.invalidateCache(key);
  }, []);

  return {
    state,
    online: state.online,
    lastSync: state.lastSync,
    refresh,
    refreshModule,
    dispatch,
    registerModule,
    unregisterModule,
    getCache,
    setCache,
    invalidateCache,
  };
}

/* ─── useOrchestratorModule ───────────────────────────────── */

export function useOrchestratorModule(
  key: OrchestratorModuleKey,
  onSync: ModuleSyncCallback,
  priority: OrchestratorPriorityValue = 2,
): void {
  const callbackRef = useRef(onSync);
  callbackRef.current = onSync;

  useEffect(() => {
    ConnexyOrchestrator.registerModule(
      key,
      (event, module) => callbackRef.current(event, module),
      priority,
    );

    return () => {
      ConnexyOrchestrator.unregisterModule(key);
    };
  }, [key, priority]);
}

/* ─── useOrchestratorEvent ────────────────────────────────── */

export function useOrchestratorEvent(
  eventType: SyncEventValue | "*",
  callback: (payload: SyncEventPayload) => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return ConnexyOrchestrator.addSyncListener(eventType, (payload) => {
      callbackRef.current(payload);
    });
  }, [eventType]);
}

/* ─── useOrchestratorSync ─────────────────────────────────── */

export interface UseOrchestratorSyncReturn {
  pending: boolean;
  error: string | null;
  lastSync: number;
  syncCount: number;
  refresh: () => void;
}

export function useOrchestratorSync(module: OrchestratorModuleKey): UseOrchestratorSyncReturn {
  const [moduleState, setModuleState] = useState(() => ConnexyOrchestrator.getModuleState(module));

  useEffect(() => {
    return ConnexyOrchestrator.addStateListener((state) => {
      setModuleState(state[module]);
    });
  }, [module]);

  const refresh = useCallback(() => {
    ConnexyOrchestrator.refreshModule(module);
  }, [module]);

  return {
    pending: moduleState.pending,
    error: moduleState.error,
    lastSync: moduleState.lastSync,
    syncCount: moduleState.syncCount,
    refresh,
  };
}
