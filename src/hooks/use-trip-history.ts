import { useSyncExternalStore } from "react";
import { getHistorySnapshot, subscribe } from "@/lib/mobility/trip/trip-store";
import type { Trip } from "@/lib/mobility/trip/trip-types";

export function useTripHistory(): Trip[] {
  return useSyncExternalStore(subscribe, getHistorySnapshot);
}
