import { CityHotspot } from "./driver-types";

interface LatLng {
  lat: number;
  lng: number;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function getMapCenter(hotspots: CityHotspot[]): LatLng {
  if (hotspots.length === 0) {
    return { lat: -23.5505, lng: -46.6333 };
  }

  const sumLat = hotspots.reduce((sum, h) => sum + h.lat, 0);
  const sumLng = hotspots.reduce((sum, h) => sum + h.lng, 0);

  return {
    lat: sumLat / hotspots.length,
    lng: sumLng / hotspots.length,
  };
}

export function calculateBounds(hotspots: CityHotspot[]): Bounds {
  if (hotspots.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  const lats = hotspots.map((h) => h.lat);
  const lngs = hotspots.map((h) => h.lng);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

export function isWithinMapArea(lat: number, lng: number, bounds: Bounds): boolean {
  return (
    lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng
  );
}

export function getZoomLevel(bounds: Bounds): number {
  const latDiff = bounds.maxLat - bounds.minLat;
  const lngDiff = bounds.maxLng - bounds.minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  if (maxDiff <= 0.01) return 14;
  if (maxDiff <= 0.03) return 13;
  if (maxDiff <= 0.06) return 12;
  if (maxDiff <= 0.12) return 11;
  if (maxDiff <= 0.25) return 10;
  if (maxDiff <= 0.5) return 9;
  if (maxDiff <= 1) return 8;
  if (maxDiff <= 2) return 7;
  return 6;
}
