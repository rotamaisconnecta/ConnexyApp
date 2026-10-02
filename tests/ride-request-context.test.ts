import { describe, expect, test } from "bun:test";
import { DEMO_ORIGIN } from "../src/components/mobility/ride/ride-data";
import {
  CURRENT_RIDE_ORIGIN_LABEL,
  buildRideRequestSearch,
  contextualRideDestination,
  destinationFromRideSearch,
  isValidRideCoordinates,
  resolveRideOrigin,
  rideLocationHasCoordinates,
} from "../src/lib/mobility/ride-request-context";
import { createTrip, getTrip, resetTrip, startOrUpdatePlanningTrip } from "../src/lib/mobility/trip/trip-store";

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

describe("origem automática da corrida", () => {
  test("reutiliza a posição demo atual e nunca o destino contextual", () => {
    const origin = resolveRideOrigin();
    expect(origin).toEqual({
      lat: DEMO_ORIGIN.lat,
      lng: DEMO_ORIGIN.lng,
      label: CURRENT_RIDE_ORIGIN_LABEL,
      address: DEMO_ORIGIN.address,
    });
    expect(origin?.label).toBe("Minha localização atual");
    expect(origin?.lat).not.toBe(-23.58);
  });

  test("buildRideRequestSearch não envia origem nem pickup do contexto", () => {
    const search = buildRideRequestSearch({
      name: "Sunset Sounds",
      address: "São Paulo, SP",
      lat: -23.5874,
      lng: -46.6576,
      source: "event",
    });
    expect(search).toMatchObject({
      destinationName: "Sunset Sounds",
      destinationAddress: "São Paulo, SP",
      destinationLat: -23.5874,
      destinationLng: -46.6576,
      source: "event",
    });
    expect(search).not.toHaveProperty("pickupLat");
    expect("pickupName" in search ? search.pickupName : undefined).toBeUndefined();
  });
});

describe("destino contextual", () => {
  test("evento, local e estabelecimento viram destino sem inventar coordenadas", () => {
    const event = contextualRideDestination({
      name: "Sunset Sounds",
      address: "São Paulo, SP",
      lat: -23.555,
      lng: -46.655,
      source: "event",
    });
    expect(event).toMatchObject({
      label: "Sunset Sounds",
      address: "São Paulo, SP",
      lat: -23.555,
      lng: -46.655,
    });

    const local = contextualRideDestination({
      name: "Sabor & Arte",
      address: "0,3 km",
      lat: -23.561,
      lng: -46.656,
      source: "local",
    });
    expect(local?.label).toBe("Sabor & Arte");
    expect(local?.lat).toBe(-23.561);

    const business = contextualRideDestination({
      name: "Bar 77",
      address: "Vila Olímpia",
      lat: -23.55,
      lng: -46.64,
      source: "business",
    });
    expect(business?.label).toBe("Bar 77");
    expect(rideLocationHasCoordinates(business)).toBe(true);
  });

  test("sem destino contextual o usuário escolhe o destino", () => {
    expect(destinationFromRideSearch({})).toBeNull();
    expect(buildRideRequestSearch({ source: "home" }).destinationName).toBeUndefined();
    expect(buildRideRequestSearch({ source: "home" }).destinationLat).toBeUndefined();
  });

  test("não inventa destino nem coordenadas quando o contexto não tem endereço", () => {
    expect(contextualRideDestination({ name: "   ", source: "event" })).toBeNull();
    const named = contextualRideDestination({
      name: "Sunset Sounds",
      address: "Parque Villa-Lobos",
    });
    expect(named?.label).toBe("Sunset Sounds");
    expect(named?.address).toBe("Parque Villa-Lobos");
    expect(rideLocationHasCoordinates(named)).toBe(false);
    expect(isValidRideCoordinates(named!.lat, named!.lng)).toBe(false);
  });

  test("nunca usa evento/local/estabelecimento como origem", () => {
    const origin = resolveRideOrigin();
    const dest = contextualRideDestination({
      name: "Café Central",
      address: "Rua Augusta, 1200",
      lat: -23.561,
      lng: -46.656,
    });
    expect(origin?.lat).toBe(DEMO_ORIGIN.lat);
    expect(origin?.lng).toBe(DEMO_ORIGIN.lng);
    expect(dest?.lat).not.toBe(origin?.lat);
    expect(dest?.label).not.toBe(origin?.label);
  });
});

describe("preservação do contexto na Trip", () => {
  test("Pedir corrida a partir de um contexto reaproveita a mesma Trip de planejamento", () => {
    installMemoryStorage();
    resetTrip();
    const origin = resolveRideOrigin();
    expect(origin).toBeTruthy();

    const first = createTrip({ origin: origin!, source: "home" });
    expect(first.status).toBe("solicitar");
    expect(first.destination).toBeNull();
    expect(first.origin.label).toBe(CURRENT_RIDE_ORIGIN_LABEL);

    const eventDest = contextualRideDestination({
      name: "Sunset Sounds",
      address: "São Paulo, SP",
      lat: -23.555,
      lng: -46.655,
      source: "event",
    });
    const second = startOrUpdatePlanningTrip({
      origin: origin!,
      destination: eventDest,
      source: "event",
    });
    expect(second.id).toBe(first.id);
    expect(second.origin.label).toBe(CURRENT_RIDE_ORIGIN_LABEL);
    expect(second.origin.lat).toBe(DEMO_ORIGIN.lat);
    expect(second.destination?.label).toBe("Sunset Sounds");
    expect(second.destination?.lat).toBe(-23.555);
    expect(second.source).toBe("event");
    expect(getTrip()?.destination?.label).toBe("Sunset Sounds");
  });
});
