import { AVAILABLE_INTERESTS } from "@/lib/discovery/discovery-types";
import { formatDistance, proximityLabel } from "@/lib/proximity";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/marketplace/business-types";

export const NEARBY_DISTANCE_STEPS = [100, 500, 2000, 2500, 3200, 5000, 10000, 20000, 50000] as const;

export const DEFAULT_NEARBY_FILTERS = {
  maxDistanceMeters: 50000,
  ageMin: 18,
  ageMax: 60,
  interests: [] as string[],
  placeCategory: "",
  openNow: false,
  eventWhen: "any" as NearbyEventWhen,
  eventCategory: "",
  businessCategory: "",
  hasOffer: false,
  minRating: 0,
};

export type NearbyEventWhen = "any" | "today" | "tomorrow" | "now";
export type NearbyExploreFilterState = typeof DEFAULT_NEARBY_FILTERS;
export type NearbyExploreKind = "todos" | "pessoas" | "eventos" | "negocios" | "locais";

export function cloneNearbyFilters(
  filters: NearbyExploreFilterState = DEFAULT_NEARBY_FILTERS,
): NearbyExploreFilterState {
  return { ...filters, interests: [...filters.interests] };
}

export function formatNearbyDistanceFilter(meters: number): string {
  if (meters >= 50000) return "Qualquer distância";
  if (meters <= 2000) return proximityLabel(meters);
  return formatDistance(meters);
}

export function countNearbyFilters(
  filters: NearbyExploreFilterState,
  kind: NearbyExploreKind,
): number {
  let count = 0;
  if (filters.maxDistanceMeters < 50000) count += 1;
  if (kind === "pessoas") {
    if (filters.ageMin !== 18 || filters.ageMax !== 60) count += 1;
    if (filters.interests.length > 0) count += 1;
  }
  if (kind === "locais") {
    if (filters.placeCategory) count += 1;
    if (filters.openNow) count += 1;
  }
  if (kind === "eventos") {
    if (filters.eventWhen !== "any") count += 1;
    if (filters.eventCategory) count += 1;
  }
  if (kind === "negocios") {
    if (filters.businessCategory) count += 1;
    if (filters.openNow) count += 1;
    if (filters.hasOffer) count += 1;
    if (filters.minRating > 0) count += 1;
  }
  return count;
}

export function isPlaceOpenNow(hours?: string): boolean {
  return Boolean(hours && /aberto/i.test(hours));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function matchesEventWhen(input: {
  when: NearbyEventWhen;
  startAt?: string;
  endAt?: string;
  hours?: string;
  now?: Date;
}): boolean {
  if (input.when === "any") return true;
  const now = input.now ?? new Date();
  const hours = input.hours ?? "";
  if (input.when === "now") {
    if (input.startAt && input.endAt) {
      const start = new Date(input.startAt).getTime();
      const end = new Date(input.endAt).getTime();
      const t = now.getTime();
      return t >= start && t <= end;
    }
    return /agora|hoje/i.test(hours);
  }
  if (input.when === "today") {
    if (input.startAt) {
      const start = startOfDay(new Date(input.startAt)).getTime();
      return start === startOfDay(now).getTime();
    }
    return /hoje/i.test(hours);
  }
  if (input.startAt) {
    const tomorrow = startOfDay(new Date(now.getTime() + 86_400_000)).getTime();
    return startOfDay(new Date(input.startAt)).getTime() === tomorrow;
  }
  return /amanhã|amanha/i.test(hours);
}

export type NearbyFilterableItem = {
  type: NearbyExploreKind;
  distanceMeters: number;
  age?: number;
  interests?: string[];
  category?: string;
  hours?: string;
  startAt?: string;
  endAt?: string;
  hasOffer?: boolean;
  rating?: number;
  price?: number;
};

export function applyNearbyExploreFilters<T extends NearbyFilterableItem>(
  items: T[],
  filters: NearbyExploreFilterState,
  kind: NearbyExploreKind,
): T[] {
  return items.filter((item) => {
    if (item.distanceMeters > filters.maxDistanceMeters) return false;
    if (kind === "pessoas") {
      if (item.age != null && (item.age < filters.ageMin || item.age > filters.ageMax)) return false;
      if (
        filters.interests.length > 0 &&
        !(item.interests ?? []).some((interest) => filters.interests.includes(interest))
      ) {
        return false;
      }
    }
    if (kind === "locais") {
      if (filters.placeCategory && item.category !== filters.placeCategory) return false;
      if (filters.openNow && !isPlaceOpenNow(item.hours)) return false;
    }
    if (kind === "eventos") {
      if (filters.eventCategory && item.category !== filters.eventCategory) return false;
      if (
        !matchesEventWhen({
          when: filters.eventWhen,
          startAt: item.startAt,
          endAt: item.endAt,
          hours: item.hours,
        })
      ) {
        return false;
      }
    }
    if (kind === "negocios") {
      if (filters.businessCategory && item.category !== filters.businessCategory) return false;
      if (filters.openNow && !isPlaceOpenNow(item.hours)) return false;
      if (filters.hasOffer && !item.hasOffer) return false;
      if (filters.minRating > 0 && (item.rating ?? 0) < filters.minRating) return false;
    }
    return true;
  });
}

export const NEARBY_INTEREST_OPTIONS = AVAILABLE_INTERESTS;
export const NEARBY_BUSINESS_CATEGORY_OPTIONS = BUSINESS_CATEGORY_OPTIONS;
