/* =========================================================
   ride-explore-pins.ts — Marcadores da tela inicial de corrida.
   Reúne motoristas, negócios e eventos já existentes no demo.
========================================================= */

import { places } from "@/lib/mock-data";
import { CatalogKind, listCatalogByKind } from "@/lib/catalog/local-catalog";
import { buildDemoFleet } from "@/lib/mobility/dispatch/demo-fleet";
import { FALLBACK_ORIGIN, geoBoundsForLocations, projectLocation, type MapPoint } from "@/lib/mobility/ride-map-layout";
import { rideLocationHasCoordinates } from "@/lib/mobility/ride-request-context";
import type { GeoLocation } from "@/lib/mobility/ride-types";

export type RideExploreKind = "motoristas" | "negocios" | "eventos" | "locais";

export type RideExplorePin = {
  id: string;
  kind: RideExploreKind;
  label: string;
  location: GeoLocation;
};

function asLocation(
  lat: number | undefined,
  lng: number | undefined,
  label: string,
  address?: string,
): GeoLocation | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const location = { lat, lng, label, address };
  return rideLocationHasCoordinates(location) ? location : null;
}

function toPin(
  id: string,
  kind: RideExploreKind,
  location: GeoLocation | null,
  label: string,
): RideExplorePin | null {
  if (!location || !rideLocationHasCoordinates(location)) return null;
  return { id, kind, label, location };
}

export function listRideExplorePins(kind: RideExploreKind): RideExplorePin[] {
  if (kind === "motoristas") {
    return buildDemoFleet()
      .filter((driver) => driver.status === "available")
      .map((driver) =>
        toPin(
          `driver-${driver.id}`,
          kind,
          {
            lat: driver.lat,
            lng: driver.lng,
            label: driver.name,
            address: driver.vehicle.name,
          },
          driver.name,
        ),
      )
      .filter((pin): pin is RideExplorePin => pin != null)
      .slice(0, 8);
  }

  if (kind === "eventos") {
    return places
      .filter((place) => place.category === "Eventos")
      .map((place) =>
        toPin(`event-${place.id}`, kind, asLocation(place.lat, place.lng, place.name, place.address), place.name),
      )
      .filter((pin): pin is RideExplorePin => pin != null)
      .slice(0, 8);
  }

  if (kind === "negocios") {
    const fromPlaces = places
      .filter((place) => place.category !== "Eventos")
      .map((place) =>
        toPin(`biz-${place.id}`, kind, asLocation(place.lat, place.lng, place.name, place.address), place.name),
      )
      .filter((pin): pin is RideExplorePin => pin != null);

    const fromCatalog = listCatalogByKind(CatalogKind.BUSINESS)
      .map((business) =>
        toPin(
          `catalog-biz-${business.id}`,
          kind,
          asLocation(business.lat, business.lng, business.name, business.address),
          business.name,
        ),
      )
      .filter((pin): pin is RideExplorePin => pin != null);

    return [...fromPlaces, ...fromCatalog].slice(0, 8);
  }

  const fromPlaces = places
    .map((place) =>
      toPin(`place-${place.id}`, kind, asLocation(place.lat, place.lng, place.name, place.address), place.name),
    )
    .filter((pin): pin is RideExplorePin => pin != null);

  const fromCatalog = listCatalogByKind(CatalogKind.PLACE)
    .map((place) =>
      toPin(
        `catalog-place-${place.id}`,
        kind,
        asLocation(place.lat, place.lng, place.name, place.address),
        place.name,
      ),
    )
    .filter((pin): pin is RideExplorePin => pin != null);

  return [...fromPlaces, ...fromCatalog].slice(0, 8);
}

export const RIDE_EXPLORE_PIN_COLORS: Record<RideExploreKind, string> = {
  motoristas: "#7C3AED",
  negocios: "#EAB308",
  eventos: "#F472B6",
  locais: "#34D399",
};

export function layoutRideExplorePins(
  origin: GeoLocation | null | undefined,
  pins: RideExplorePin[],
): { user: MapPoint | null; pins: Array<RideExplorePin & { point: MapPoint }> } {
  const validPins = pins.filter((pin) => rideLocationHasCoordinates(pin.location));
  const locations = [
    origin,
    ...validPins.map((pin) => pin.location),
  ].filter((location): location is GeoLocation => Boolean(location && rideLocationHasCoordinates(location)));
  const bounds = geoBoundsForLocations(locations);
  const project = (location: GeoLocation): MapPoint =>
    bounds && rideLocationHasCoordinates(location)
      ? projectLocation(location, bounds)
      : FALLBACK_ORIGIN;

  return {
    user: origin ? project(origin) : FALLBACK_ORIGIN,
    pins: validPins.map((pin) => ({ ...pin, point: project(pin.location) })),
  };
}
