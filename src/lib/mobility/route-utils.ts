/* =========================================================
   route-utils.ts — Route and stop management utilities
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { GeoLocation } from "./ride-types";

/* ─── RouteStop ──────────────────────────────────────────── */

export interface RouteStop {
  id: string;
  location: GeoLocation;
  label: string;
  order: number;
}

/* ─── createStop ─────────────────────────────────────────── */

export function createStop(location: GeoLocation, label: string, order: number): RouteStop {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    location,
    label,
    order,
  };
}

/* ─── addStop ────────────────────────────────────────────── */

export function addStop(stops: RouteStop[], location: GeoLocation, label: string): RouteStop[] {
  const newStop = createStop(location, label, stops.length + 1);
  return [...stops, newStop];
}

/* ─── removeStop ─────────────────────────────────────────── */

export function removeStop(stops: RouteStop[], stopId: string): RouteStop[] {
  return stops.filter((s) => s.id !== stopId).map((s, i) => ({ ...s, order: i + 1 }));
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
