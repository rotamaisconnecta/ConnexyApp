/* =========================================================
   discovery-filter.ts — Pure filter functions
   No React. No side effects. No Supabase.
========================================================= */

import type { DiscoveryPerson, DiscoveryFilters } from "./discovery-types";

/* ─── filterPeople ───────────────────────────────────────── */

export function filterPeople(
  people: DiscoveryPerson[],
  filters: DiscoveryFilters,
): DiscoveryPerson[] {
  return people.filter((p) => {
    if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) return false;
    if (p.distanceMeters > filters.maxDistance) return false;
    if (filters.onlineOnly && !p.online) return false;
    if (filters.withMoment && !p.moment) return false;
    if (p.compatibilityScore < filters.minCompatibility) return false;
    if (filters.interests.length > 0 && !filters.interests.some((i) => p.interests.includes(i)))
      return false;
    return true;
  });
}

/* ─── searchPeople ───────────────────────────────────────── */

export function searchPeople(people: DiscoveryPerson[], query: string): DiscoveryPerson[] {
  const q = query.toLowerCase().trim();
  if (!q) return people;

  return people.filter((p) => {
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.handle.toLowerCase().includes(q)) return true;
    if (p.bio?.toLowerCase().includes(q)) return true;
    if (p.headline?.toLowerCase().includes(q)) return true;
    if (p.profession?.toLowerCase().includes(q)) return true;
    if (p.interests.some((i) => i.toLowerCase().includes(q))) return true;
    return false;
  });
}
