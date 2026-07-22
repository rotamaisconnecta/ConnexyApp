/* ==== integration-driver.ts -- Driver integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  EngineDriverInput,
  HeatLevelValue,
  DriverIntegrationData,
} from "./integration-types";
import { IntegrationAction, HeatLevel } from "./integration-types";
import { generateIntegrationId, haversineDistance, formatEta } from "./integration-utils";

/* ==== Create driver online integration event ==== */

export function createDriverOnlineEvent(
  driverId: string,
  driverName: string,
  lat: number,
  lng: number,
  serviceArea: string,
  vehicle: string,
): IntegrationEvent {
  return {
    id: generateIntegrationId("drv"),
    action: IntegrationAction.DRIVER_ONLINE,
    sourceTarget: "DRIVER",
    targets: ["MAP", "RIDE", "ENGINE", "NOTIFICATIONS"],
    timestamp: new Date().toISOString(),
    payload: {
      kind: "driver",
      driverId,
      driverName,
      lat,
      lng,
      serviceArea,
      vehicle,
    },
    processed: false,
  };
}

/* ==== Driver data transformation ==== */

export function toEngineDriverInput(data: DriverIntegrationData): EngineDriverInput {
  return {
    id: data.driverId,
    name: data.driverName,
    lat: data.lat,
    lng: data.lng,
    rating: data.rating,
    isAvailable: data.isAvailable,
    etaMinutes: data.etaMinutes,
  };
}

/* ==== Driver proximity scoring ==== */

export function scoreDriverProximity(
  driverLat: number,
  driverLng: number,
  userLat: number,
  userLng: number,
): { distanceMeters: number; score: number; etaLabel: string } {
  const distance = haversineDistance(userLat, userLng, driverLat, driverLng);
  let score = 0;

  if (distance < 500) score = 100;
  else if (distance < 1000) score = 80;
  else if (distance < 2000) score = 60;
  else if (distance < 5000) score = 40;
  else score = 20;

  const etaMin = Math.max(1, Math.round(distance / 500));
  return {
    distanceMeters: distance,
    score,
    etaLabel: formatEta(etaMin),
  };
}

/* ==== Driver heat level for map ==== */

export function calculateDriverAreaHeatLevel(
  onlineDrivers: number,
  activeRides: number,
): HeatLevelValue {
  const totalActivity = onlineDrivers + activeRides * 2;
  if (totalActivity >= 10) return HeatLevel.BURNING;
  if (totalActivity >= 5) return HeatLevel.HOT;
  if (totalActivity >= 2) return HeatLevel.WARM;
  return HeatLevel.COLD;
}

/* ==== Driver map marker data ==== */

export function createDriverMarkerData(
  driver: DriverIntegrationData,
  userLat: number,
  userLng: number,
): {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  distanceMeters: number;
  isAvailable: boolean;
  rating: number;
  vehicle: string;
} {
  const proximity = scoreDriverProximity(driver.lat, driver.lng, userLat, userLng);
  return {
    id: driver.driverId,
    lat: driver.lat,
    lng: driver.lng,
    title: driver.driverName,
    subtitle: `${driver.vehicle} • ${proximity.etaLabel}`,
    distanceMeters: proximity.distanceMeters,
    isAvailable: driver.isAvailable,
    rating: driver.rating,
    vehicle: driver.vehicle,
  };
}

/* ==== Driver notification generation ==== */

export function generateDriverNotification(
  driver: DriverIntegrationData,
  userLat: number,
  userLng: number,
): { title: string; body: string; priority: "LOW" | "MEDIUM" | "HIGH" } | null {
  if (!driver.isOnline || !driver.isAvailable) return null;

  const proximity = scoreDriverProximity(driver.lat, driver.lng, userLat, userLng);
  if (proximity.distanceMeters > 3000) return null;

  const priority =
    proximity.distanceMeters < 500 ? "HIGH" : proximity.distanceMeters < 1000 ? "MEDIUM" : "LOW";

  return {
    title: `🚗 Motorista próximo`,
    body: `${driver.driverName} a ${proximity.etaLabel} • ${driver.vehicle}`,
    priority,
  };
}

/* ==== Driver ride matching data ==== */

export interface DriverMatchData {
  driverId: string;
  driverName: string;
  distanceMeters: number;
  rating: number;
  vehicle: string;
  etaMinutes: number;
  isAvailable: boolean;
  matchScore: number;
}

export function computeDriverMatchScore(
  driver: DriverIntegrationData,
  userLat: number,
  userLng: number,
  isFavorite: boolean = false,
): DriverMatchData {
  const proximity = scoreDriverProximity(driver.lat, driver.lng, userLat, userLng);

  let matchScore = proximity.score;
  matchScore += driver.rating * 5;
  if (driver.isAvailable) matchScore += 20;
  if (isFavorite) matchScore += 15;

  const etaMin = Math.max(1, Math.round(proximity.distanceMeters / 500));

  return {
    driverId: driver.driverId,
    driverName: driver.driverName,
    distanceMeters: proximity.distanceMeters,
    rating: driver.rating,
    vehicle: driver.vehicle,
    etaMinutes: etaMin,
    isAvailable: driver.isAvailable,
    matchScore,
  };
}

export function rankDriverMatches(
  drivers: DriverIntegrationData[],
  userLat: number,
  userLng: number,
  favoriteIds: string[] = [],
): DriverMatchData[] {
  return drivers
    .map((d) => computeDriverMatchScore(d, userLat, userLng, favoriteIds.includes(d.driverId)))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/* ==== Driver engine input generation ==== */

export function generateDriverEngineInputs(
  drivers: DriverIntegrationData[],
  userLat: number,
  userLng: number,
): EngineDriverInput[] {
  return drivers.filter((d) => d.isOnline).map((d) => toEngineDriverInput(d));
}

/* ==== Driver feed text generation ==== */

export function generateDriverFeedText(driver: DriverIntegrationData): {
  text: string;
  emoji: string;
} {
  if (driver.isAvailable) {
    return {
      text: `${driver.driverName} está disponível em ${driver.serviceArea}`,
      emoji: "🚗",
    };
  }
  return {
    text: `${driver.driverName} está online em ${driver.serviceArea}`,
    emoji: "🟢",
  };
}

/* ==== Driver status aggregation ==== */

export function aggregateDriverStatus(drivers: DriverIntegrationData[]): {
  totalOnline: number;
  totalAvailable: number;
  averageRating: number;
  areas: Map<string, number>;
} {
  const online = drivers.filter((d) => d.isOnline);
  const available = online.filter((d) => d.isAvailable);
  const areas = new Map<string, number>();

  for (const driver of online) {
    areas.set(driver.serviceArea, (areas.get(driver.serviceArea) ?? 0) + 1);
  }

  const avgRating =
    online.length > 0 ? online.reduce((sum, d) => sum + d.rating, 0) / online.length : 0;

  return {
    totalOnline: online.length,
    totalAvailable: available.length,
    averageRating: avgRating,
    areas,
  };
}
