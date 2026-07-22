/* ==== integration-map.ts -- Map integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  MapMarker,
  MapMarkerTypeValue,
  MapMarkerActionValue,
  HeatLevelValue,
  TrendingDirectionValue,
  PlaceStatusValue,
} from "./integration-types";
import { MapMarkerType, MapMarkerAction, HeatLevel, TrendingDirection } from "./integration-types";
import {
  haversineDistance,
  sortByDistance,
  sortByScore,
  getHeatLevel,
  getTrendingDirection,
  formatDistance,
  formatRelativeTime,
  getMarkerTypeEmoji,
} from "./integration-utils";

/* ==== Map state ==== */

export interface MapState {
  markers: MapMarker[];
  userLat: number;
  userLng: number;
  zoom: number;
  selectedMarkerId: string | null;
  visibleTypes: MapMarkerTypeValue[];
}

/* ==== Map initialization ==== */

export function createMapState(userLat: number, userLng: number, zoom = 14): MapState {
  return {
    markers: [],
    userLat,
    userLng,
    zoom,
    selectedMarkerId: null,
    visibleTypes: Object.values(MapMarkerType),
  };
}

/* ==== Marker management ==== */

export function addMarker(state: MapState, marker: MapMarker): MapState {
  const existing = state.markers.findIndex((m) => m.id === marker.id);
  if (existing >= 0) {
    const markers = [...state.markers];
    markers[existing] = marker;
    return { ...state, markers };
  }
  return { ...state, markers: [...state.markers, marker] };
}

export function addMarkers(state: MapState, newMarkers: MapMarker[]): MapState {
  let updated = { ...state };
  for (const marker of newMarkers) {
    updated = addMarker(updated, marker);
  }
  return updated;
}

export function removeMarker(state: MapState, markerId: string): MapState {
  return {
    ...state,
    markers: state.markers.filter((m) => m.id !== markerId),
    selectedMarkerId: state.selectedMarkerId === markerId ? null : state.selectedMarkerId,
  };
}

export function selectMarker(state: MapState, markerId: string | null): MapState {
  return { ...state, selectedMarkerId: markerId };
}

export function filterByType(state: MapState, types: MapMarkerTypeValue[]): MapState {
  return { ...state, visibleTypes: types };
}

export function toggleType(state: MapState, type: MapMarkerTypeValue): MapState {
  const visible = state.visibleTypes.includes(type)
    ? state.visibleTypes.filter((t) => t !== type)
    : [...state.visibleTypes, type];
  return { ...state, visibleTypes: visible };
}

/* ==== Marker queries ==== */

export function getVisibleMarkers(state: MapState): MapMarker[] {
  return state.markers.filter((m) => state.visibleTypes.includes(m.type));
}

export function getMarkerById(state: MapState, id: string): MapMarker | undefined {
  return state.markers.find((m) => m.id === id);
}

export function getSelectedMarker(state: MapState): MapMarker | undefined {
  if (!state.selectedMarkerId) return undefined;
  return getMarkerById(state, state.selectedMarkerId);
}

export function getNearbyMarkers(state: MapState, radiusMeters: number): MapMarker[] {
  return getVisibleMarkers(state).filter(
    (m) => haversineDistance(state.userLat, state.userLng, m.lat, m.lng) <= radiusMeters,
  );
}

export function getMarkersByType(state: MapState, type: MapMarkerTypeValue): MapMarker[] {
  return getVisibleMarkers(state).filter((m) => m.type === type);
}

export function getHotMarkers(state: MapState): MapMarker[] {
  return getVisibleMarkers(state).filter(
    (m) => m.heatLevel === HeatLevel.HOT || m.heatLevel === HeatLevel.BURNING,
  );
}

export function getTrendingMarkers(state: MapState): MapMarker[] {
  return getVisibleMarkers(state).filter((m) => m.trending === TrendingDirection.UP);
}

/* ==== Marker sorting ==== */

export function sortMarkersByDistance(state: MapState): MapMarker[] {
  const markers = getVisibleMarkers(state).map((m) => ({
    ...m,
    distanceMeters: haversineDistance(state.userLat, state.userLng, m.lat, m.lng),
  }));
  return sortByDistance(markers);
}

export function sortMarkersByHeat(state: MapState): MapMarker[] {
  const heatOrder: Record<HeatLevelValue, number> = {
    BURNING: 4,
    HOT: 3,
    WARM: 2,
    COLD: 1,
  };
  return [...getVisibleMarkers(state)].sort(
    (a, b) => heatOrder[b.heatLevel] - heatOrder[a.heatLevel],
  );
}

/* ==== Marker action handling ==== */

export interface MarkerAction {
  type: MapMarkerActionValue;
  markerId: string;
  timestamp: string;
}

export function handleMarkerAction(action: MapMarkerActionValue, markerId: string): MarkerAction {
  return {
    type: action,
    markerId,
    timestamp: new Date().toISOString(),
  };
}

export function getMarkerActionUrl(marker: MapMarker, action: MapMarkerActionValue): string {
  const baseUrl = marker.actionUrl;

  switch (action) {
    case MapMarkerAction.NAVIGATE:
      return `https://maps.google.com/?q=${marker.lat},${marker.lng}`;
    case MapMarkerAction.SHARE:
      return `${baseUrl}?share=true`;
    case MapMarkerAction.FAVORITE:
      return `${baseUrl}?favorite=true`;
    case MapMarkerAction.SAVE:
      return `${baseUrl}?save=true`;
    case MapMarkerAction.PREVIEW:
      return `${baseUrl}?preview=true`;
    default:
      return baseUrl;
  }
}

/* ==== Map marker summary text ==== */

export function getMarkerSummaryText(marker: MapMarker): string {
  const emoji = getMarkerTypeEmoji(marker.type);
  const distance = formatDistance(marker.distanceMeters);

  let statusText = "";
  if (marker.placeStatus) {
    const statusLabels: Record<PlaceStatusValue, string> = {
      CALMO: "Calmo",
      MOVIMENTADO: "Movimentado",
      BOMBANDO: "Bombando",
      MUITO_CHEIO: "Muito cheio",
      EVENTO_ACONTECENDO: "Evento acontecendo",
    };
    statusText = ` • ${statusLabels[marker.placeStatus]}`;
  }

  return `${emoji} ${marker.title} • ${distance}${statusText}`;
}

/* ==== Map clustering helpers ==== */

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  markers: MapMarker[];
  dominantType: MapMarkerTypeValue;
}

export function clusterMarkers(markers: MapMarker[], radiusMeters: number = 100): MapCluster[] {
  const clusters: MapCluster[] = [];
  const used = new Set<string>();

  for (const marker of markers) {
    if (used.has(marker.id)) continue;

    const nearby = markers.filter(
      (m) =>
        !used.has(m.id) && haversineDistance(marker.lat, marker.lng, m.lat, m.lng) <= radiusMeters,
    );

    if (nearby.length === 0) {
      used.add(marker.id);
      continue;
    }

    const typeCounts = new Map<MapMarkerTypeValue, number>();
    for (const m of nearby) {
      typeCounts.set(m.type, (typeCounts.get(m.type) ?? 0) + 1);
      used.add(m.id);
    }

    const dominantType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];

    const avgLat = nearby.reduce((s, m) => s + m.lat, 0) / nearby.length;
    const avgLng = nearby.reduce((s, m) => s + m.lng, 0) / nearby.length;

    clusters.push({
      id: `cluster_${clusters.length}`,
      lat: avgLat,
      lng: avgLng,
      count: nearby.length,
      markers: nearby,
      dominantType,
    });
  }

  return clusters;
}

/* ==== Map stats ==== */

export function getMapStats(state: MapState): {
  total: number;
  byType: Record<MapMarkerTypeValue, number>;
  hotCount: number;
  trendingCount: number;
  nearbyCount: number;
} {
  const markers = getVisibleMarkers(state);
  const byType = {} as Record<MapMarkerTypeValue, number>;
  for (const type of Object.values(MapMarkerType)) {
    byType[type] = 0;
  }
  for (const m of markers) {
    byType[m.type] += 1;
  }

  return {
    total: markers.length,
    byType,
    hotCount: markers.filter(
      (m) => m.heatLevel === HeatLevel.HOT || m.heatLevel === HeatLevel.BURNING,
    ).length,
    trendingCount: markers.filter((m) => m.trending === TrendingDirection.UP).length,
    nearbyCount: getNearbyMarkers(state, 1000).length,
  };
}
