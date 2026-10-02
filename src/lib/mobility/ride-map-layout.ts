/* =========================================================
   ride-map-layout.ts — Projeta origem, paradas e destino
   reais no plano do MapCanvas (viewBox 400×300).
   Pure TypeScript. Sem React.
========================================================= */

import { rideLocationHasCoordinates } from "./ride-request-context";
import type { GeoLocation } from "./ride-types";
import type { RouteStop } from "./route-utils";

export type MapPoint = { x: number; y: number };

export const MAP_VIEW = { width: 400, height: 300, padX: 42, padY: 38 };

export const FALLBACK_ORIGIN: MapPoint = { x: 56, y: 252 };
export const FALLBACK_DEST: MapPoint = { x: 302, y: 44 };

export type GeoBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type RideRouteLayout = {
  origin: MapPoint | null;
  destination: MapPoint | null;
  stops: Array<{ id: string; label: string; order: number; point: MapPoint }>;
  path: MapPoint[];
};

function sortedStops(stops: RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => a.order - b.order);
}

export function geoBoundsForLocations(locations: GeoLocation[]): GeoBounds | null {
  const valid = locations.filter(rideLocationHasCoordinates);
  if (valid.length === 0) return null;
  let minLat = valid[0].lat;
  let maxLat = valid[0].lat;
  let minLng = valid[0].lng;
  let maxLng = valid[0].lng;
  for (const location of valid.slice(1)) {
    minLat = Math.min(minLat, location.lat);
    maxLat = Math.max(maxLat, location.lat);
    minLng = Math.min(minLng, location.lng);
    maxLng = Math.max(maxLng, location.lng);
  }
  const latPad = Math.max((maxLat - minLat) * 0.18, 0.004);
  const lngPad = Math.max((maxLng - minLng) * 0.18, 0.004);
  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  };
}

export function projectLocation(location: GeoLocation, bounds: GeoBounds): MapPoint {
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
  const x = MAP_VIEW.padX + ((location.lng - bounds.minLng) / lngSpan) * (MAP_VIEW.width - MAP_VIEW.padX * 2);
  const y =
    MAP_VIEW.padY + (1 - (location.lat - bounds.minLat) / latSpan) * (MAP_VIEW.height - MAP_VIEW.padY * 2);
  return {
    x: Math.max(18, Math.min(MAP_VIEW.width - 18, x)),
    y: Math.max(18, Math.min(MAP_VIEW.height - 18, y)),
  };
}

export function unprojectMapPoint(point: MapPoint, bounds: GeoBounds): { lat: number; lng: number } {
  const innerW = MAP_VIEW.width - MAP_VIEW.padX * 2;
  const innerH = MAP_VIEW.height - MAP_VIEW.padY * 2;
  const nx = (point.x - MAP_VIEW.padX) / innerW;
  const ny = (point.y - MAP_VIEW.padY) / innerH;
  return {
    lng: bounds.minLng + Math.max(0, Math.min(1, nx)) * (bounds.maxLng - bounds.minLng),
    lat: bounds.maxLat - Math.max(0, Math.min(1, ny)) * (bounds.maxLat - bounds.minLat),
  };
}

function separateOverlapping(points: MapPoint[]): MapPoint[] {
  return points.map((point, index) => {
    const previous = points.slice(0, index);
    const collides = previous.some((other) => Math.hypot(other.x - point.x, other.y - point.y) < 14);
    if (!collides) return point;
    const angle = (index * 0.9) % (Math.PI * 2);
    return {
      x: Math.max(18, Math.min(MAP_VIEW.width - 18, point.x + Math.cos(angle) * 16)),
      y: Math.max(18, Math.min(MAP_VIEW.height - 18, point.y + Math.sin(angle) * 16)),
    };
  });
}

/** Insere vias intermediárias para o smoothPath existente não virar uma reta. */
export function enrichRoutePath(points: MapPoint[]): MapPoint[] {
  if (points.length < 2) return points;
  const out: MapPoint[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const offset = 16 * (i % 2 === 0 ? 1 : -1);
    out.push({
      x: (start.x + end.x) / 2 - (dy / length) * offset,
      y: (start.y + end.y) / 2 + (dx / length) * offset,
    });
    out.push(end);
  }
  return out;
}

export function layoutRideRoute(
  origin: GeoLocation | null | undefined,
  destination: GeoLocation | null | undefined,
  stops: RouteStop[],
): RideRouteLayout {
  const orderedStops = sortedStops(stops);
  const located = [
    origin,
    ...orderedStops.map((stop) => stop.location),
    destination,
  ].filter((location): location is GeoLocation => Boolean(location && rideLocationHasCoordinates(location)));
  const bounds = geoBoundsForLocations(located);

  const project = (location: GeoLocation | null | undefined, fallback: MapPoint): MapPoint | null => {
    if (!location) return null;
    if (bounds && rideLocationHasCoordinates(location)) return projectLocation(location, bounds);
    return fallback;
  };

  const originPoint = origin ? project(origin, FALLBACK_ORIGIN) : null;
  const stopPoints = orderedStops.map((stop, index) => ({
    id: stop.id,
    label: stop.label,
    order: stop.order,
    point:
      project(stop.location, {
        x: 128 + index * 56,
        y: 218 - index * 62,
      }) ?? FALLBACK_ORIGIN,
  }));
  const destinationPoint = destination ? project(destination, FALLBACK_DEST) : null;

  const rawPath = [
    originPoint,
    ...stopPoints.map((stop) => stop.point),
    destinationPoint,
  ].filter((point): point is MapPoint => point != null);
  const separated = separateOverlapping(rawPath);

  let cursor = 0;
  const take = (present: boolean): MapPoint | null => {
    if (!present) return null;
    const point = separated[cursor];
    cursor += 1;
    return point ?? null;
  };

  const nextOrigin = take(originPoint != null);
  const nextStops = stopPoints.map((stop) => ({
    ...stop,
    point: take(true) ?? stop.point,
  }));
  const nextDestination = take(destinationPoint != null);

  const path = [
    nextOrigin,
    ...nextStops.map((stop) => stop.point),
    nextDestination,
  ].filter((point): point is MapPoint => point != null);

  return {
    origin: nextOrigin,
    destination: nextDestination,
    stops: nextStops,
    path,
  };
}

/** Compatível com o desenho anterior: origem → paradas → destino. */
export function layoutRoutePoints(
  origin: GeoLocation | null | undefined,
  destination: GeoLocation | null | undefined,
  stops: RouteStop[],
): MapPoint[] {
  return layoutRideRoute(origin, destination, stops).path;
}
