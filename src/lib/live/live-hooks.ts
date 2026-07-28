/* ============================================================
   CONNEXY
   Phase 8.5
   Live Ecosystem — React Hooks
=========================================================== */

import { useState, useEffect, useCallback, useRef } from "react";
import type { LiveEvent, LiveEventTypeValue, LiveEventPayload } from "./live-events";
import { subscribeLiveEvent, getRecentLiveEvents } from "./live-engine";

/* ─── useLiveEvent ───────────────────────────────────────── */

export function useLiveEvent<T extends LiveEventPayload = LiveEventPayload>(
  type: LiveEventTypeValue,
  callback: (event: LiveEvent<T>) => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsub = subscribeLiveEvent(type, (event) => {
      callbackRef.current(event as LiveEvent<T>);
    });
    return unsub;
  }, [type]);
}

/* ─── useLiveEvents ──────────────────────────────────────── */

export function useLiveEvents(count: number = 10): LiveEvent[] {
  const [events, setEvents] = useState<LiveEvent[]>(() => getRecentLiveEvents(count));

  useEffect(() => {
    const unsub = subscribeLiveEvent("*", () => {
      setEvents(getRecentLiveEvents(count));
    });
    return unsub;
  }, [count]);

  return events;
}

/* ─── useLiveUpdates ─────────────────────────────────────── */

export interface LiveUpdatesResult {
  events: LiveEvent[];
  lastEvent: LiveEvent | null;
  unreadCount: number;
  markRead: () => void;
  clearEvents: () => void;
}

export function useLiveUpdates(maxEvents: number = 20): LiveUpdatesResult {
  const [events, setEvents] = useState<LiveEvent[]>(() => getRecentLiveEvents(maxEvents));
  const [unreadCount, setUnreadCount] = useState(0);
  const lastEventRef = useRef<LiveEvent | null>(null);

  useEffect(() => {
    const unsub = subscribeLiveEvent("*", (event) => {
      lastEventRef.current = event;
      setEvents(getRecentLiveEvents(maxEvents));
      setUnreadCount((prev) => prev + 1);
    });
    return unsub;
  }, [maxEvents]);

  const markRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setUnreadCount(0);
    lastEventRef.current = null;
  }, []);

  return {
    events,
    lastEvent: lastEventRef.current,
    unreadCount,
    markRead,
    clearEvents,
  };
}

/* ─── useLiveListener ────────────────────────────────────── */

export function useLiveListener(
  types: LiveEventTypeValue[],
  callback: (event: LiveEvent) => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const typesKey = types.join(",");

  useEffect(() => {
    const typeList = typesKey.split(",") as LiveEventTypeValue[];
    const unsubs = typeList.map((type) =>
      subscribeLiveEvent(type, (event) => {
        callbackRef.current(event);
      }),
    );
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [typesKey]);
}
