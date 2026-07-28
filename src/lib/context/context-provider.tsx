/* eslint-disable react-refresh/only-export-components */
/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Provider
============================================================ */

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { ContextState, ContextRecommendation } from "./context-types";
import {
  getCurrentContext,
  refreshContext,
  getRecommendations,
  getPeriodSuggestion,
} from "./context-engine";
import { subscribeLiveEvent } from "@/lib/live/live-engine";
import { LiveEventType, type LiveEventTypeValue } from "@/lib/live/live-events";

/* ─── Context Shape ─────────────────────────────────────── */

export interface ContextEngineValue {
  state: ContextState;
  recommendations: ContextRecommendation[];
  periodSuggestion: string;
  refresh: () => void;
}

export const ContextEngineContext = createContext<ContextEngineValue | null>(null);

/* ─── Provider ──────────────────────────────────────────── */

interface ContextEngineProviderProps {
  children: ReactNode;
}

const CONTEXT_REFRESH_EVENTS: LiveEventTypeValue[] = [
  LiveEventType.CHECKIN_CREATED,
  LiveEventType.DRIVER_ONLINE,
  LiveEventType.DRIVER_OFFLINE,
  LiveEventType.USER_ENTER_AREA,
  LiveEventType.USER_EXIT_AREA,
  LiveEventType.EVENT_CREATED,
];

export function ContextEngineProvider({ children }: ContextEngineProviderProps) {
  const [state, setState] = useState<ContextState>(getCurrentContext);
  const [recommendations, setRecommendations] = useState<ContextRecommendation[]>([]);
  const [periodSuggestion, setPeriodSuggestion] = useState("");

  const refresh = useCallback(() => {
    const fresh = refreshContext();
    setState(fresh);
    setRecommendations(getRecommendations(fresh));
    setPeriodSuggestion(getPeriodSuggestion(fresh));
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh context when role changes
  useEffect(() => {
    function handleRoleChanged() {
      refresh();
    }

    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, [refresh]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Refresh context when relevant live events arrive
  useEffect(() => {
    const unsub = subscribeLiveEvent("*", (event) => {
      if (CONTEXT_REFRESH_EVENTS.includes(event.type)) {
        refresh();
      }
    });
    return unsub;
  }, [refresh]);

  return (
    <ContextEngineContext.Provider value={{ state, recommendations, periodSuggestion, refresh }}>
      {children}
    </ContextEngineContext.Provider>
  );
}
