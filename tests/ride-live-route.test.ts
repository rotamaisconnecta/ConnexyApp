import { describe, expect, test } from "bun:test";
import { DEMO_DESTINATIONS } from "../src/components/mobility/ride/ride-data";
import { layoutRideRoute } from "../src/lib/mobility/ride-map-layout";
import {
  addStop,
  buildRoutePoints,
  computeTripRouteMeta,
  MAX_ROUTE_STOPS,
  removeStop,
  replaceStop,
} from "../src/lib/mobility/route-utils";
import { createTrip, patchTrip, resetTrip } from "../src/lib/mobility/trip/trip-store";

const originA = { lat: -23.55, lng: -46.64, label: "Origem A", address: "Bela Cintra, 750" };
const destB = { lat: -23.5305, lng: -46.642, label: "Destino B", address: "Av. Paulista, 1578" };
const stopC = { lat: -23.561, lng: -46.656, label: "Parada C", address: "Rua Augusta, 1200" };
const stopD = { lat: -23.5874, lng: -46.6576, label: "Parada D", address: "Ibirapuera" };
const stopE = { lat: -23.5535, lng: -46.638, label: "Parada E", address: "Rua Harmonia, 340" };
const originF = { lat: -23.5432, lng: -46.6292, label: "Nova origem" };
const destG = { lat: -23.5632, lng: -46.6542, label: "Novo destino" };

function labelsOf(
  origin: typeof originA,
  dest: typeof destB,
  stops: ReturnType<typeof addStop>,
) {
  return buildRoutePoints(origin, dest, stops).map((point) => point.label);
}

function installMemoryStorage() {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => {
      data.set(String(key), String(value));
    },
  } as Storage;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { localStorage: storage, dispatchEvent: () => true, addEventListener() {}, removeEventListener() {} },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
}

describe("rota viva origem → paradas → destino", () => {
  test("respeita o limite já existente de paradas", () => {
    expect(MAX_ROUTE_STOPS).toBe(3);
    expect(DEMO_DESTINATIONS.length).toBeGreaterThan(0);
  });

  test("cada edição atualiza sequência, distância, tempo e pontos do mapa", () => {
    let stops = addStop([], stopC, stopC.label);
    expect(labelsOf(originA, destB, stops)).toEqual(["Origem A", "Parada C", "Destino B"]);

    stops = addStop(stops, stopD, stopD.label);
    expect(labelsOf(originA, destB, stops)).toEqual(["Origem A", "Parada C", "Parada D", "Destino B"]);

    const withC = computeTripRouteMeta(originA, stops, destB);
    stops = replaceStop(stops, stops[0].id, stopE, stopE.label);
    expect(labelsOf(originA, destB, stops)).toEqual(["Origem A", "Parada E", "Parada D", "Destino B"]);

    const withE = computeTripRouteMeta(originA, stops, destB);
    expect(withE.ok).toBe(true);
    expect(withE.distanceMeters).not.toBe(withC.distanceMeters);

    stops = removeStop(stops, stops[1].id);
    expect(labelsOf(originA, destB, stops)).toEqual(["Origem A", "Parada E", "Destino B"]);

    const afterRemove = computeTripRouteMeta(originA, stops, destB);
    expect(afterRemove.durationMinutes).toBeLessThan(withE.durationMinutes);

    const afterOrigin = computeTripRouteMeta(originF, stops, destB);
    expect(afterOrigin.distanceMeters).not.toBe(afterRemove.distanceMeters);

    const afterDest = computeTripRouteMeta(originF, stops, destG);
    expect(afterDest.distanceMeters).not.toBe(afterOrigin.distanceMeters);

    const mapAB = layoutRideRoute(originA, destB, []);
    const mapAEB = layoutRideRoute(originA, destB, stops);
    expect(mapAB.path.length).toBe(2);
    expect(mapAEB.path.length).toBe(3);
    expect(mapAEB.stops).toHaveLength(1);
    expect(mapAEB.origin).not.toBeNull();
    expect(mapAEB.destination).not.toBeNull();
    expect(mapAEB.stops[0].point).not.toEqual(mapAB.origin);
    expect(mapAEB.stops[0].point).not.toEqual(mapAB.destination);
  });

  test("patch da Trip recalcula distância e tempo ao mudar a rota", () => {
    installMemoryStorage();
    resetTrip();
    const trip = createTrip({ origin: originA, destination: destB });
    const baseline = trip.distanceMeters;
    const withStop = patchTrip({
      stops: addStop([], stopC, stopC.label),
    });
    expect(withStop?.distanceMeters).toBeGreaterThan(baseline);
    expect(withStop?.durationMinutes).not.toBe(trip.durationMinutes);
    const originChanged = patchTrip({ origin: originF });
    expect(originChanged?.origin.label).toBe("Nova origem");
    expect(originChanged?.stops).toHaveLength(1);
    expect(originChanged?.destination?.label).toBe("Destino B");
    expect(originChanged?.distanceMeters).not.toBe(withStop?.distanceMeters);
  });
});
