/* =========================================================
   business-ranking.ts — Business sorting and ranking logic
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { Business } from "./business-types";
import { SortOption, type SortOptionValue } from "./business-types";

/* ─── sortByNearest ─────────────────────────────────────── */

export function sortByNearest(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/* ─── sortByBestRated ───────────────────────────────────── */

export function sortByBestRated(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => b.rating.average - a.rating.average);
}

/* ─── sortByMostPopular ─────────────────────────────────── */

export function sortByMostPopular(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => b.rating.totalReviews - a.rating.totalReviews);
}

/* ─── sortByPromotions ──────────────────────────────────── */

export function sortByPromotions(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => b.promotions.length - a.promotions.length);
}

/* ─── sortByOpenNow ─────────────────────────────────────── */

export function sortByOpenNow(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => {
    if (a.isOpen === b.isOpen) return a.distanceMeters - b.distanceMeters;
    return a.isOpen ? -1 : 1;
  });
}

/* ─── sortBusinesses ────────────────────────────────────── */

export function sortBusinesses(businesses: Business[], sortBy: SortOptionValue): Business[] {
  switch (sortBy) {
    case SortOption.NEAREST:
      return sortByNearest(businesses);
    case SortOption.BEST_RATED:
      return sortByBestRated(businesses);
    case SortOption.MOST_POPULAR:
      return sortByMostPopular(businesses);
    case SortOption.PROMOTIONS:
      return sortByPromotions(businesses);
    case SortOption.OPEN_NOW:
      return sortByOpenNow(businesses);
    default:
      return sortByNearest(businesses);
  }
}

/* ─── rankBusinesses ────────────────────────────────────── */

export interface RankOptions {
  categories?: string[];
  sortBy?: SortOptionValue;
  maxDistance?: number;
  minRating?: number;
  isOpenOnly?: boolean;
  hasPromotions?: boolean;
}

export function rankBusinesses(businesses: Business[], options?: RankOptions): Business[] {
  let result = [...businesses];

  if (options?.categories && options.categories.length > 0) {
    result = result.filter((b) => options.categories!.includes(b.category));
  }

  if (options?.maxDistance !== undefined) {
    result = result.filter((b) => b.distanceMeters <= options.maxDistance!);
  }

  if (options?.minRating !== undefined) {
    result = result.filter((b) => b.rating.average >= options.minRating!);
  }

  if (options?.isOpenOnly) {
    result = result.filter((b) => b.isOpen);
  }

  if (options?.hasPromotions) {
    result = result.filter((b) => b.promotions.length > 0);
  }

  return sortBusinesses(result, options?.sortBy ?? SortOption.NEAREST);
}

/* ─── findClosest ───────────────────────────────────────── */

export function findClosest(businesses: Business[]): Business | null {
  if (businesses.length === 0) return null;
  return sortByNearest(businesses)[0];
}

/* ─── findBestRated ─────────────────────────────────────── */

export function findBestRated(businesses: Business[]): Business | null {
  if (businesses.length === 0) return null;
  return sortByBestRated(businesses)[0];
}

/* ─── getBusinessRankingSummary ─────────────────────────── */

export interface BusinessRankingSummary {
  total: number;
  open: number;
  withPromotions: number;
  withEvents: number;
  averageRating: number;
  closestDistance: number;
}

export function getBusinessRankingSummary(businesses: Business[]): BusinessRankingSummary {
  if (businesses.length === 0) {
    return {
      total: 0,
      open: 0,
      withPromotions: 0,
      withEvents: 0,
      averageRating: 0,
      closestDistance: 0,
    };
  }

  const open = businesses.filter((b) => b.isOpen).length;
  const withPromotions = businesses.filter((b) => b.promotions.length > 0).length;
  const withEvents = businesses.filter((b) => b.events.length > 0).length;
  const averageRating =
    businesses.reduce((sum, b) => sum + b.rating.average, 0) / businesses.length;
  const closestDistance = Math.min(...businesses.map((b) => b.distanceMeters));

  return {
    total: businesses.length,
    open,
    withPromotions,
    withEvents,
    averageRating: Math.round(averageRating * 10) / 10,
    closestDistance,
  };
}
