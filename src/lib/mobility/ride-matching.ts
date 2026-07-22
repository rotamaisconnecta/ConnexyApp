/* =========================================================
   ride-matching.ts — Driver matching and ranking
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { DriverMatch, VehicleCategoryValue, GeoLocation } from "./ride-types";

/* ─── sortByEta ──────────────────────────────────────────── */

export function sortByEta(drivers: DriverMatch[]): DriverMatch[] {
  return [...drivers].sort((a, b) => a.etaMinutes - b.etaMinutes);
}

/* ─── sortByPrice ────────────────────────────────────────── */

export function sortByPrice(drivers: DriverMatch[]): DriverMatch[] {
  return [...drivers].sort((a, b) => a.priceEstimate.finalPrice - b.priceEstimate.finalPrice);
}

/* ─── sortByRating ───────────────────────────────────────── */

export function sortByRating(drivers: DriverMatch[]): DriverMatch[] {
  return [...drivers].sort((a, b) => b.rating - a.rating);
}

/* ─── sortByDistance ─────────────────────────────────────── */

export function sortByDistance(drivers: DriverMatch[]): DriverMatch[] {
  return [...drivers].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/* ─── filterByCategory ───────────────────────────────────── */

export function filterByCategory(
  drivers: DriverMatch[],
  category: VehicleCategoryValue,
): DriverMatch[] {
  return drivers.filter((d) => d.vehicle.category === category);
}

/* ─── filterFavorites ────────────────────────────────────── */

export function filterFavorites(drivers: DriverMatch[]): DriverMatch[] {
  return drivers.filter((d) => d.isFavorite);
}

/* ─── findClosest ────────────────────────────────────────── */

export function findClosest(drivers: DriverMatch[]): DriverMatch | null {
  if (drivers.length === 0) return null;
  return sortByDistance(drivers)[0];
}

/* ─── findCheapest ───────────────────────────────────────── */

export function findCheapest(drivers: DriverMatch[]): DriverMatch | null {
  if (drivers.length === 0) return null;
  return sortByPrice(drivers)[0];
}

/* ─── findBestRated ──────────────────────────────────────── */

export function findBestRated(drivers: DriverMatch[]): DriverMatch | null {
  if (drivers.length === 0) return null;
  return sortByRating(drivers)[0];
}

/* ─── rankDrivers ────────────────────────────────────────── */

export function rankDrivers(
  drivers: DriverMatch[],
  options?: { category?: VehicleCategoryValue; sortBy?: "eta" | "price" | "rating" | "distance" },
): DriverMatch[] {
  let result = [...drivers];

  if (options?.category) {
    result = filterByCategory(result, options.category);
  }

  switch (options?.sortBy) {
    case "eta":
      return sortByEta(result);
    case "price":
      return sortByPrice(result);
    case "rating":
      return sortByRating(result);
    case "distance":
      return sortByDistance(result);
    default:
      return sortByEta(result);
  }
}

/* ─── calculateDistanceToDriver ──────────────────────────── */

export function calculateDistanceToDriver(
  _userLocation: GeoLocation,
  driverDistanceMeters: number,
): number {
  return driverDistanceMeters;
}

/* ─── getDriverMatchSummary ──────────────────────────────── */

export function getDriverMatchSummary(drivers: DriverMatch[]): {
  total: number;
  nearestEta: number;
  cheapestPrice: number;
  highestRating: number;
} {
  if (drivers.length === 0) {
    return { total: 0, nearestEta: 0, cheapestPrice: 0, highestRating: 0 };
  }

  const sorted = sortByEta(drivers);
  const cheapest = sortByPrice(drivers);
  const rated = sortByRating(drivers);

  return {
    total: drivers.length,
    nearestEta: sorted[0].etaMinutes,
    cheapestPrice: cheapest[0].priceEstimate.finalPrice,
    highestRating: rated[0].rating,
  };
}
