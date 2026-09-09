import { useSyncExternalStore } from "react";
import { getTripSnapshot, subscribe } from "@/lib/mobility/trip/trip-store";
import type { Trip } from "@/lib/mobility/trip/trip-types";

export function useTrip(): Trip | null {
  return useSyncExternalStore(subscribe, getTripSnapshot);
}
