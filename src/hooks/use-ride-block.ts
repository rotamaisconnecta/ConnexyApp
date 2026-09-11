import { useSyncExternalStore } from "react";
import { getRideBlocksSnapshot, getBlockForUser, subscribe } from "@/lib/mobility/trip/ride-blocks";
import type { RideBlock } from "@/lib/mobility/trip/ride-blocks";

export function useRideBlock(userId: string): RideBlock | null {
  useSyncExternalStore(subscribe, getRideBlocksSnapshot);
  return getBlockForUser(userId);
}
