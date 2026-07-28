/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Detector
   All mock data lives here. Prepared for GPS integration.
============================================================ */

import {
  ContextPeriod,
  ContextWeather,
  ContextMovement,
  ContextEnvironment,
  type ContextPeriodValue,
  type ContextWeatherValue,
  type ContextMovementValue,
  type ContextEnvironmentValue,
} from "./context-types";

/* ─── detectPeriod ──────────────────────────────────────── */

export function detectPeriod(): ContextPeriodValue {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return ContextPeriod.MORNING;
  if (hour >= 12 && hour < 18) return ContextPeriod.AFTERNOON;
  if (hour >= 18 && hour < 22) return ContextPeriod.EVENING;
  return ContextPeriod.NIGHT;
}

/* ─── detectWeather ─────────────────────────────────────── */

export function detectWeather(): ContextWeatherValue {
  // Mock: rotating based on day of year for variety
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );

  const weatherCycle: ContextWeatherValue[] = [
    ContextWeather.SUNNY,
    ContextWeather.SUNNY,
    ContextWeather.CLOUDY,
    ContextWeather.RAIN,
    ContextWeather.SUNNY,
    ContextWeather.HOT,
    ContextWeather.CLOUDY,
    ContextWeather.COLD,
    ContextWeather.SUNNY,
    ContextWeather.RAIN,
  ];

  return weatherCycle[dayOfYear % weatherCycle.length];
}

/* ─── detectMovement ────────────────────────────────────── */

export function detectMovement(): ContextMovementValue {
  const hour = new Date().getHours();

  // Rush hours: 7-9 and 17-19 → BUSY
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return ContextMovement.BUSY;
  }

  // Lunch: 11-13 → NORMAL
  if (hour >= 11 && hour <= 13) {
    return ContextMovement.NORMAL;
  }

  // Late night: 22-5 → CALM
  if (hour >= 22 || hour <= 5) {
    return ContextMovement.CALM;
  }

  // Weekend midday can be CROWDED
  const day = new Date().getDay();
  if ((day === 0 || day === 6) && hour >= 10 && hour <= 16) {
    return ContextMovement.CROWDED;
  }

  return ContextMovement.NORMAL;
}

/* ─── detectEnvironment ─────────────────────────────────── */

export function detectEnvironment(): ContextEnvironmentValue {
  // Mock: rotating environments based on hour for demo variety
  const hour = new Date().getHours();

  if (hour >= 0 && hour <= 6) return ContextEnvironment.HOME;
  if (hour >= 7 && hour <= 8) return ContextEnvironment.ROAD;
  if (hour >= 9 && hour <= 11) return ContextEnvironment.BUSINESS;
  if (hour >= 12 && hour <= 13) return ContextEnvironment.SHOPPING;
  if (hour >= 14 && hour <= 16) return ContextEnvironment.CITY;
  if (hour >= 17 && hour <= 18) return ContextEnvironment.ROAD;
  if (hour >= 19 && hour <= 20) return ContextEnvironment.EVENT;
  if (hour >= 21 && hour <= 23) return ContextEnvironment.HOME;

  return ContextEnvironment.CITY;
}

/* ─── detectNearby ──────────────────────────────────────── */

export function detectNearby(): {
  nearEvents: number;
  nearBusinesses: number;
  nearDrivers: number;
  nearPeople: number;
} {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  const baseEvents = isWeekend ? 5 : 2;
  const hourFactor = hour >= 10 && hour <= 22 ? 1.5 : 0.5;

  return {
    nearEvents: Math.round(baseEvents * hourFactor),
    nearBusinesses: Math.round((3 + Math.random() * 5) * hourFactor),
    nearDrivers: Math.round((2 + Math.random() * 8) * hourFactor),
    nearPeople: Math.round((10 + Math.random() * 30) * hourFactor),
  };
}

/* ─── detectHotArea ─────────────────────────────────────── */

export function detectHotArea(): boolean {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend && hour >= 10 && hour <= 22) return true;
  if (!isWeekend && hour >= 17 && hour <= 22) return true;
  return false;
}

/* ─── detectLocationName ────────────────────────────────── */

export function detectLocationName(environment: ContextEnvironmentValue): string {
  const locationNames: Record<ContextEnvironmentValue, string> = {
    [ContextEnvironment.CITY]: "Centro da cidade",
    [ContextEnvironment.SHOPPING]: "Shopping Center",
    [ContextEnvironment.EVENT]: "Área de eventos",
    [ContextEnvironment.AIRPORT]: "Aeroporto",
    [ContextEnvironment.UNIVERSITY]: "Campus universitário",
    [ContextEnvironment.BEACH]: "Praia",
    [ContextEnvironment.PARK]: "Parque",
    [ContextEnvironment.BUSINESS]: "Distrito empresarial",
    [ContextEnvironment.HOME]: "Em casa",
    [ContextEnvironment.ROAD]: "Em deslocamento",
  };

  return locationNames[environment];
}
