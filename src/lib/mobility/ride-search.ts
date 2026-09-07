/* =========================================================
   ride-search.ts — Richiesta de busca compartilhada do fluxo
   de mobilidade. Tipos Zod + parsing de companions.
   Pure TypeScript. No React.
========================================================= */

import { z } from "zod";
import type { GeoLocation } from "./ride-types";
import { createStop, orderStopsForRoute, type RouteStop } from "./route-utils";

export const rideSearchSchema = z.object({
  destinationId: z.string().optional().nullable(),
  destinationName: z.string().optional().nullable(),
  destinationAddress: z.string().optional().nullable(),
  destinationLat: z.number().optional().nullable(),
  destinationLng: z.number().optional().nullable(),
  pickupName: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  pickupLat: z.number().optional().nullable(),
  pickupLng: z.number().optional().nullable(),
  companions: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export type RideSearch = z.infer<typeof rideSearchSchema>;

export type CompanionStopInput = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export function parseCompanions(raw: string | null | undefined): CompanionStopInput[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CompanionStopInput =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CompanionStopInput).id === "string" &&
        typeof (item as CompanionStopInput).name === "string" &&
        typeof (item as CompanionStopInput).address === "string" &&
        typeof (item as CompanionStopInput).lat === "number" &&
        typeof (item as CompanionStopInput).lng === "number",
    );
  } catch {
    return [];
  }
}

export function buildCompanionStops(origin: GeoLocation, companions: CompanionStopInput[]): RouteStop[] {
  const stops = companions.map((companion, index) =>
    createStop(
      { lat: companion.lat, lng: companion.lng, label: companion.address },
      `${companion.name.split(" ")[0]} — ${companion.address}`,
      index + 1,
    ),
  );
  return orderStopsForRoute(origin, stops);
}