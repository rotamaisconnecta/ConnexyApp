/* =========================================================
   business-filter.ts — Business filtering logic
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { Business, MarketplaceFilters } from "./business-types";
import { BusinessCategory, PriceRange, SortOption } from "./business-types";

/* ─── DEFAULT_FILTERS ───────────────────────────────────── */

export const DEFAULT_FILTERS: MarketplaceFilters = {
  categories: [],
  priceRange: [],
  minRating: 0,
  isOpen: false,
  hasPromotions: false,
  hasEvents: false,
  maxDistance: 50000,
  searchQuery: "",
  sortBy: SortOption.NEAREST,
};

/* ─── filterBusinesses ──────────────────────────────────── */

export function filterBusinesses(businesses: Business[], filters: MarketplaceFilters): Business[] {
  let result = [...businesses];

  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)) ||
        b.address.toLowerCase().includes(q),
    );
  }

  if (filters.categories.length > 0) {
    result = result.filter((b) => filters.categories.includes(b.category));
  }

  if (filters.priceRange.length > 0) {
    result = result.filter((b) => filters.priceRange.includes(b.priceRange));
  }

  if (filters.minRating > 0) {
    result = result.filter((b) => b.rating.average >= filters.minRating);
  }

  if (filters.isOpen) {
    result = result.filter((b) => b.isOpen);
  }

  if (filters.hasPromotions) {
    result = result.filter((b) => b.promotions.length > 0);
  }

  if (filters.hasEvents) {
    result = result.filter((b) => b.events.length > 0);
  }

  if (filters.maxDistance < 50000) {
    result = result.filter((b) => b.distanceMeters <= filters.maxDistance);
  }

  return result;
}

/* ─── hasActiveFilters ──────────────────────────────────── */

export function hasActiveFilters(filters: MarketplaceFilters): boolean {
  return (
    filters.categories.length > 0 ||
    filters.priceRange.length > 0 ||
    filters.minRating > 0 ||
    filters.isOpen ||
    filters.hasPromotions ||
    filters.hasEvents ||
    filters.maxDistance < 50000 ||
    filters.searchQuery.trim().length > 0
  );
}

/* ─── getActiveFilterCount ──────────────────────────────── */

export function getActiveFilterCount(filters: MarketplaceFilters): number {
  let count = 0;
  if (filters.categories.length > 0) count++;
  if (filters.priceRange.length > 0) count++;
  if (filters.minRating > 0) count++;
  if (filters.isOpen) count++;
  if (filters.hasPromotions) count++;
  if (filters.hasEvents) count++;
  if (filters.maxDistance < 50000) count++;
  return count;
}

/* ─── resetFilters ──────────────────────────────────────── */

export function resetFilters(): MarketplaceFilters {
  return { ...DEFAULT_FILTERS };
}

/* ─── toggleCategory ────────────────────────────────────── */

export function toggleCategory(current: string[], category: string): string[] {
  if (current.includes(category)) {
    return current.filter((c) => c !== category);
  }
  return [...current, category];
}

/* ─── togglePriceRange ──────────────────────────────────── */

export function togglePriceRange(current: string[], price: string): string[] {
  if (current.includes(price)) {
    return current.filter((p) => p !== price);
  }
  return [...current, price];
}

/* ─── getSearchSuggestions ──────────────────────────────── */

export function getSearchSuggestions(businesses: Business[], query: string): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const names = businesses.map((b) => b.name);
  return names.filter((n) => n.toLowerCase().includes(q)).slice(0, 5);
}
