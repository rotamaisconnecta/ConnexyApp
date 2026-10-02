/* =========================================================
   route-utils.ts — Route and stop management utilities
   Pure TypeScript. No React. No side effects.
========================================================= */

import { rideLocationHasCoordinates } from "./ride-request-context";
import type { GeoLocation } from "./ride-types";

export const MAX_ROUTE_STOPS = 3;

/* ─── RouteStop ──────────────────────────────────────────── */

export interface RouteStop {
  id: string;
  location: GeoLocation;
  label: string;
  order: number;
  companionId?: string;
}

/* ─── createStop ─────────────────────────────────────────── */

export function createStop(
  location: GeoLocation,
  label: string,
  order: number,
  companionId?: string,
): RouteStop {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    location,
    label,
    order,
    ...(companionId ? { companionId } : {}),
  };
}

/* ─── addStop ────────────────────────────────────────────── */

export function addStop(
  stops: RouteStop[],
  location: GeoLocation,
  label: string,
  companionId?: string,
): RouteStop[] {
  if (stops.length >= MAX_ROUTE_STOPS) return stops;
  if (companionId && stops.some((stop) => stop.companionId === companionId)) return stops;
  const newStop = createStop(location, label, stops.length + 1, companionId);
  return [...stops, newStop];
}

export function limitRouteStops(stops: RouteStop[]): RouteStop[] {
  return stops.slice(0, MAX_ROUTE_STOPS).map((stop, index) => ({ ...stop, order: index + 1 }));
}

/* ─── removeStop ─────────────────────────────────────────── */

export function removeStop(stops: RouteStop[], stopId: string): RouteStop[] {
  return stops.filter((s) => s.id !== stopId).map((s, i) => ({ ...s, order: i + 1 }));
}

export function replaceStop(
  stops: RouteStop[],
  stopId: string,
  location: GeoLocation,
  label: string,
): RouteStop[] {
  return stops.map((stop) =>
    stop.id === stopId
      ? { ...stop, label, location: { ...location, label, address: location.address } }
      : stop,
  );
}

/* ─── reorderStops ───────────────────────────────────────── */

export function reorderStops(stops: RouteStop[], fromIndex: number, toIndex: number): RouteStop[] {
  const result = [...stops];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result.map((s, i) => ({ ...s, order: i + 1 }));
}

/* ─── getTotalStops ──────────────────────────────────────── */

export function getTotalStops(stops: RouteStop[]): number {
  return stops.length;
}

/* ─── orderStopsForRoute ─────────────────────────────────── */
/* Ordena as paradas pela melhor rota a partir da origem
   (vizinho mais próximo). Mantém as paradas originais. */

export function orderStopsForRoute(origin: GeoLocation, stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return stops;
  const remaining = [...stops];
  const ordered: RouteStop[] = [];
  let cursor = origin;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const distance = estimateRouteDistance(cursor, remaining[index].location);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    const sorted: RouteStop[] = remaining.splice(bestIndex, 1);
    const next = sorted[0];
    ordered.push(next);
    cursor = next.location;
  }
  return ordered.map((stop, index) => ({ ...stop, order: index + 1 }));
}

/* ─── formatStopsText ────────────────────────────────────── */

export function formatStopsText(stops: RouteStop[]): string {
  if (stops.length === 0) return "Direto ao destino";
  return `${stops.length} parada${stops.length > 1 ? "s" : ""}`;
}

/* ─── estimateExtraTime ──────────────────────────────────── */

export function estimateExtraTime(stops: RouteStop[]): number {
  return stops.length * 3;
}

/* ─── buildRoutePoints ───────────────────────────────────── */

export function buildRoutePoints(
  origin: GeoLocation,
  destination: GeoLocation,
  stops: RouteStop[],
): GeoLocation[] {
  const sorted = [...stops].sort((a, b) => a.order - b.order);
  return [origin, ...sorted.map((s) => s.location), destination];
}

/* ─── estimateRouteDistance ──────────────────────────────── */

export function estimateRouteDistance(origin: GeoLocation, destination: GeoLocation): number {
  const R = 6371000;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ─── estimateRouteDuration ──────────────────────────────── */

export function estimateRouteDuration(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  return Math.max(3, Math.round(km * 3.5));
}

export function canComputeTripRoute(
  origin: GeoLocation | null | undefined,
  destination: GeoLocation | null | undefined,
): boolean {
  return rideLocationHasCoordinates(origin) && rideLocationHasCoordinates(destination);
}

export function computeTripRouteMeta(
  origin: GeoLocation | null | undefined,
  stops: RouteStop[],
  destination: GeoLocation | null | undefined,
): { distanceMeters: number; durationMinutes: number; ok: boolean } {
  if (!canComputeTripRoute(origin, destination) || !origin || !destination) {
    return { distanceMeters: 0, durationMinutes: 0, ok: false };
  }
  const points = buildRoutePoints(origin, destination, stops);
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    if (!rideLocationHasCoordinates(points[i - 1]) || !rideLocationHasCoordinates(points[i])) {
      return { distanceMeters: 0, durationMinutes: 0, ok: false };
    }
    total += estimateRouteDistance(points[i - 1], points[i]);
  }
  total = Math.max(400, Math.round(total));
  const duration = estimateRouteDuration(total) + stops.length * 3;
  return { distanceMeters: total, durationMinutes: duration, ok: true };
}

export function formatRouteDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function formatRouteDuration(minutes: number): string {
  return `${minutes} min`;
}
