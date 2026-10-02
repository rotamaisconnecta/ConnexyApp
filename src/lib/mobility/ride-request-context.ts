/* =========================================================
   ride-request-context.ts — Origem automática + destino
   contextual do fluxo único de corrida.

   Origem  = posição atual do usuário (demo: DEMO_ORIGIN)
   Destino = contexto da tela, se válido; senão o usuário escolhe

   Nunca usa evento/local/estabelecimento como origem.
   Nunca inventa coordenadas para preencher a interface.
========================================================= */

import { DEMO_ORIGIN } from "@/components/mobility/ride/ride-data";
import type { GeoLocation } from "./ride-types";
import type { RideSearch } from "./ride-search";

export const CURRENT_RIDE_ORIGIN_LABEL = "Minha localização atual";

/** Coordenada sentinela JSON-safe para destino contextual sem lat/lng. */
const UNRESOLVED_RIDE_COORDINATE = 1000;

export type RideDestinationContext = {
  id?: string | null;
  name?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  source?: string | null;
  companions?: string | null;
};

function trimText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidRideCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function rideLocationHasCoordinates(location: GeoLocation | null | undefined): boolean {
  return Boolean(location && isValidRideCoordinates(location.lat, location.lng));
}

export function resolveRideOrigin(): GeoLocation | null {
  if (!isValidRideCoordinates(DEMO_ORIGIN.lat, DEMO_ORIGIN.lng)) return null;
  return {
    lat: DEMO_ORIGIN.lat,
    lng: DEMO_ORIGIN.lng,
    label: CURRENT_RIDE_ORIGIN_LABEL,
    address: DEMO_ORIGIN.address,
  };
}

export function contextualRideDestination(
  input: RideDestinationContext | null | undefined,
): GeoLocation | null {
  if (!input) return null;
  const name = trimText(input.name);
  const address = trimText(input.address);
  const label = name ?? address;
  if (!label) return null;

  const lat = input.lat;
  const lng = input.lng;
  if (typeof lat === "number" && typeof lng === "number" && isValidRideCoordinates(lat, lng)) {
    return { lat, lng, label, address: address ?? undefined };
  }

  return {
    lat: UNRESOLVED_RIDE_COORDINATE,
    lng: UNRESOLVED_RIDE_COORDINATE,
    label,
    address: address ?? undefined,
  };
}

export function destinationFromRideSearch(search: RideSearch): GeoLocation | null {
  return contextualRideDestination({
    id: search.destinationId,
    name: search.destinationName,
    address: search.destinationAddress,
    lat: search.destinationLat,
    lng: search.destinationLng,
    source: search.source,
    companions: search.companions,
  });
}

export function buildRideRequestSearch(context: RideDestinationContext = {}): RideSearch {
  const name = trimText(context.name);
  const address = trimText(context.address);
  const hasDestination = Boolean(name || address);
  const hasCoords =
    typeof context.lat === "number" &&
    typeof context.lng === "number" &&
    isValidRideCoordinates(context.lat, context.lng);

  return {
    destinationId: hasDestination ? trimText(context.id) : undefined,
    destinationName: hasDestination ? (name ?? address) : undefined,
    destinationAddress: hasDestination ? address : undefined,
    destinationLat: hasDestination && hasCoords ? context.lat : undefined,
    destinationLng: hasDestination && hasCoords ? context.lng : undefined,
    companions: context.companions || undefined,
    source: trimText(context.source),
  };
}
