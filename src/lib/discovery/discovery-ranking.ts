/* =========================================================
   discovery-ranking.ts — Pure ranking functions
   No React. No side effects. No Supabase.
========================================================= */

import type { DiscoveryPerson, DiscoverySortValue } from "./discovery-types";
import { DiscoverySort } from "./discovery-types";

/* ─── sortByDistance ─────────────────────────────────────── */

export function sortByDistance(people: DiscoveryPerson[]): DiscoveryPerson[] {
  return [...people].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/* ─── sortByCompatibility ────────────────────────────────── */

export function sortByCompatibility(people: DiscoveryPerson[]): DiscoveryPerson[] {
  return [...people].sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/* ─── sortByRecent ───────────────────────────────────────── */

export function sortByRecent(people: DiscoveryPerson[]): DiscoveryPerson[] {
  return [...people].sort((a, b) => {
    if (a.moment && b.moment) {
      return b.moment.remainingMs - a.moment.remainingMs;
    }
    if (a.moment) return -1;
    if (b.moment) return 1;
    return b.compatibilityScore - a.compatibilityScore;
  });
}

/* ─── sortByOnline ───────────────────────────────────────── */

export function sortByOnline(people: DiscoveryPerson[]): DiscoveryPerson[] {
  return [...people].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.distanceMeters - b.distanceMeters;
  });
}

/* ─── sortPeople ─────────────────────────────────────────── */

const SORT_FNS: Record<DiscoverySortValue, (people: DiscoveryPerson[]) => DiscoveryPerson[]> = {
  [DiscoverySort.DISTANCE]: sortByDistance,
  [DiscoverySort.COMPATIBILITY]: sortByCompatibility,
  [DiscoverySort.RECENT]: sortByRecent,
  [DiscoverySort.ONLINE]: sortByOnline,
};

export function sortPeople(people: DiscoveryPerson[], sort: DiscoverySortValue): DiscoveryPerson[] {
  return SORT_FNS[sort](people);
}
