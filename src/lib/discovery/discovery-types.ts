/* =========================================================
   discovery-types.ts — Discovery module types
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { CompatibilityTier } from "@/lib/profile/compatibility";

/* ─── Enums ──────────────────────────────────────────────── */

export const DiscoverySort = {
  DISTANCE: "DISTANCE",
  COMPATIBILITY: "COMPATIBILITY",
  RECENT: "RECENT",
  ONLINE: "ONLINE",
} as const;

export type DiscoverySortValue = (typeof DiscoverySort)[keyof typeof DiscoverySort];

export const DISCOVERY_SORT_OPTIONS: {
  value: DiscoverySortValue;
  label: string;
}[] = [
  { value: DiscoverySort.DISTANCE, label: "Mais próximos" },
  { value: DiscoverySort.COMPATIBILITY, label: "Maior compatibilidade" },
  { value: DiscoverySort.RECENT, label: "Mais recentes" },
  { value: DiscoverySort.ONLINE, label: "Online" },
];

/* ─── Person ─────────────────────────────────────────────── */

export interface DiscoveryPerson {
  id: string;
  name: string;
  age: number;
  photo: string;
  handle: string;
  headline: string | null;
  bio: string | null;
  online: boolean;
  lastSeen: string | null;
  distanceMeters: number;
  interests: string[];
  vibeTags: string[];
  favoritePlaceIds: string[];
  profession: string | null;
  moment: DiscoveryMoment | null;
  compatibilityScore: number;
  compatibilityTier: CompatibilityTier;
  compatibilityLabel: string;
}

/* ─── Moment ─────────────────────────────────────────────── */

export interface DiscoveryMoment {
  text: string;
  placeName: string | null;
  status: string;
  statusLabel: string;
  remainingMs: number;
  expired: boolean;
}

/* ─── Filters ────────────────────────────────────────────── */

export interface DiscoveryFilters {
  interests: string[];
  ageRange: [number, number];
  maxDistance: number;
  onlineOnly: boolean;
  withMoment: boolean;
  minCompatibility: number;
}

export const INITIAL_FILTERS: DiscoveryFilters = {
  interests: [],
  ageRange: [18, 60],
  maxDistance: 50000,
  onlineOnly: false,
  withMoment: false,
  minCompatibility: 0,
};

export const AVAILABLE_INTERESTS = [
  "Viagens",
  "Tecnologia",
  "Networking",
  "Negócios",
  "Arte",
  "Cinema",
  "Games",
  "Esportes",
  "Música",
  "Empreendedorismo",
  "Café",
  "Fotografia",
];

/* ─── Visibility ─────────────────────────────────────────── */

export type VisibilityMode = "visible" | "hidden" | "connections_only";

/* ─── Actions ────────────────────────────────────────────── */

export interface DiscoveryAction {
  personId: string;
  type: "connect" | "favorite" | "ignore";
  timestamp: Date;
}
