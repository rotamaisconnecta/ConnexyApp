/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Types
============================================================ */

import type { UserRole } from "@/lib/roles/roles-types";

/* ─── ContextPeriod ─────────────────────────────────────── */

export const ContextPeriod = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
  NIGHT: "NIGHT",
} as const;

export type ContextPeriodValue = (typeof ContextPeriod)[keyof typeof ContextPeriod];

/* ─── ContextWeather ────────────────────────────────────── */

export const ContextWeather = {
  SUNNY: "SUNNY",
  RAIN: "RAIN",
  CLOUDY: "CLOUDY",
  HOT: "HOT",
  COLD: "COLD",
} as const;

export type ContextWeatherValue = (typeof ContextWeather)[keyof typeof ContextWeather];

/* ─── ContextMovement ───────────────────────────────────── */

export const ContextMovement = {
  CALM: "CALM",
  NORMAL: "NORMAL",
  BUSY: "BUSY",
  CROWDED: "CROWDED",
} as const;

export type ContextMovementValue = (typeof ContextMovement)[keyof typeof ContextMovement];

/* ─── ContextEnvironment ────────────────────────────────── */

export const ContextEnvironment = {
  CITY: "CITY",
  SHOPPING: "SHOPPING",
  EVENT: "EVENT",
  AIRPORT: "AIRPORT",
  UNIVERSITY: "UNIVERSITY",
  BEACH: "BEACH",
  PARK: "PARK",
  BUSINESS: "BUSINESS",
  HOME: "HOME",
  ROAD: "ROAD",
} as const;

export type ContextEnvironmentValue = (typeof ContextEnvironment)[keyof typeof ContextEnvironment];

/* ─── ContextNearby ─────────────────────────────────────── */

export interface ContextNearby {
  nearEvents: number;
  nearBusinesses: number;
  nearDrivers: number;
  nearPeople: number;
}

/* ─── ContextState ──────────────────────────────────────── */

export interface ContextState {
  currentRole: UserRole;
  currentLocation: string;
  environment: ContextEnvironmentValue;
  movement: ContextMovementValue;
  weather: ContextWeatherValue;
  period: ContextPeriodValue;
  nearEvents: number;
  nearBusinesses: number;
  nearDrivers: number;
  nearPeople: number;
  hotArea: boolean;
}

/* ─── ContextRecommendation ─────────────────────────────── */

export interface ContextRecommendation {
  id: string;
  type: "action" | "content" | "suggestion";
  title: string;
  description: string;
  icon: string;
  route: string;
  priority: number;
}
