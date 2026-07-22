/* =========================================================
   distance-utils.ts — Distance and location utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { GeoLocation } from "./business-types";

/* ─── EARTH_RADIUS_KM ───────────────────────────────────── */

const EARTH_RADIUS_KM = 6371;

/* ─── toRadians ─────────────────────────────────────────── */

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/* ─── calculateDistance ──────────────────────────────────── */

export function calculateDistance(from: GeoLocation, to: GeoLocation): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/* ─── calculateDistanceMeters ────────────────────────────── */

export function calculateDistanceMeters(from: GeoLocation, to: GeoLocation): number {
  return Math.round(calculateDistance(from, to) * 1000);
}

/* ─── formatDistance ─────────────────────────────────────── */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")}km`;
}

/* ─── formatDistanceShort ────────────────────────────────── */

export function formatDistanceShort(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${Math.round(meters / 1000)}km`;
}

/* ─── sortByDistance ─────────────────────────────────────── */

export function sortByDistance<T extends { distanceMeters: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/* ─── filterByMaxDistance ────────────────────────────────── */

export function filterByMaxDistance<T extends { distanceMeters: number }>(
  items: T[],
  maxMeters: number,
): T[] {
  return items.filter((item) => item.distanceMeters <= maxMeters);
}

/* ─── getDistanceLabel ───────────────────────────────────── */

export function getDistanceLabel(meters: number): string {
  if (meters < 500) return "Muito perto";
  if (meters < 1000) return "Perto";
  if (meters < 3000) return "Perto";
  if (meters < 5000) return "Moderado";
  if (meters < 10000) return "Alguns km";
  return "Longe";
}

/* ─── getDistanceColor ───────────────────────────────────── */

export function getDistanceColor(meters: number): string {
  if (meters < 1000) return "text-success";
  if (meters < 3000) return "text-blue-soft";
  if (meters < 5000) return "text-amber";
  return "text-muted-foreground";
}

/* ─── getDistanceBgColor ─────────────────────────────────── */

export function getDistanceBgColor(meters: number): string {
  if (meters < 1000) return "bg-success/15 text-success";
  if (meters < 3000) return "bg-blue-soft/15 text-blue-soft";
  if (meters < 5000) return "bg-amber/15 text-amber";
  return "bg-muted text-muted-foreground";
}

/* ─── getMapDirectionsUrl ────────────────────────────────── */

export function getMapDirectionsUrl(origin: GeoLocation, destination: GeoLocation): string {
  return `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
}

/* ─── getMapPreviewUrl ───────────────────────────────────── */

export function getMapPreviewUrl(location: GeoLocation, zoom: number = 15): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=${zoom}&size=400x200&markers=${location.lat},${location.lng}`;
}

/* ─── isWithinRadius ─────────────────────────────────────── */

export function isWithinRadius(center: GeoLocation, point: GeoLocation, radiusKm: number): boolean {
  return calculateDistance(center, point) <= radiusKm;
}

/* ─── getBoundingBox ─────────────────────────────────────── */

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function getBoundingBox(center: GeoLocation, radiusKm: number): BoundingBox {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lngDelta =
    (radiusKm / (EARTH_RADIUS_KM * Math.cos(toRadians(center.lat)))) * (180 / Math.PI);

  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}
