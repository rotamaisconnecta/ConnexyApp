/* ============================================================
   CONNEXY
   Phase 8.5
   Live Ecosystem — Engine (Event Bus)
   Pure TypeScript. No React. No side effects.
=========================================================== */

import type {
  LiveEvent,
  LiveEventTypeValue,
  LiveEventPayload,
  LiveEventCallback,
  LiveSubscription,
} from "./live-events";
import { generateLiveId } from "./live-events";

/* ─── Engine State ───────────────────────────────────────── */

interface LiveEngineState {
  subscriptions: Map<string, LiveSubscription>;
  history: LiveEvent[];
  maxHistory: number;
}

const state: LiveEngineState = {
  subscriptions: new Map(),
  history: [],
  maxHistory: 100,
};

/* ─── Subscribe ──────────────────────────────────────────── */

export function subscribeLiveEvent(
  type: LiveEventTypeValue | "*",
  callback: LiveEventCallback,
): () => void {
  const id = generateLiveId();
  const subscription: LiveSubscription = { id, type, callback };
  state.subscriptions.set(id, subscription);

  return () => {
    state.subscriptions.delete(id);
  };
}

/* ─── Unsubscribe ────────────────────────────────────────── */

export function unsubscribeLiveEvent(subscriptionId: string): void {
  state.subscriptions.delete(subscriptionId);
}

/* ─── Dispatch ───────────────────────────────────────────── */

export function dispatchLiveEventRaw<T extends LiveEventPayload>(event: LiveEvent<T>): void {
  state.history.push(event);
  if (state.history.length > state.maxHistory) {
    state.history = state.history.slice(-state.maxHistory);
  }

  for (const subscription of state.subscriptions.values()) {
    if (subscription.type === "*" || subscription.type === event.type) {
      try {
        subscription.callback(event as LiveEvent);
      } catch {
        // Silently ignore subscriber errors to prevent one broken subscriber from affecting others
      }
    }
  }
}

/* ─── History ────────────────────────────────────────────── */

export function getLiveEventHistory(): LiveEvent[] {
  return [...state.history];
}

export function getLiveEventHistoryByType(type: LiveEventTypeValue): LiveEvent[] {
  return state.history.filter((e) => e.type === type);
}

export function getRecentLiveEvents(count: number): LiveEvent[] {
  return state.history.slice(-count);
}

export function clearLiveEventHistory(): void {
  state.history = [];
}

/* ─── Subscriber Count ───────────────────────────────────── */

export function getSubscriberCount(type?: LiveEventTypeValue): number {
  if (!type) return state.subscriptions.size;
  let count = 0;
  for (const sub of state.subscriptions.values()) {
    if (sub.type === "*" || sub.type === type) count++;
  }
  return count;
}
