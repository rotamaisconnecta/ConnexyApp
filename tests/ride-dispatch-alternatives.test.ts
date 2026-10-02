import { beforeEach, describe, expect, test } from "bun:test";
import {
  acceptRideOffer,
  setDemoDispatcherConfig,
} from "../src/lib/mobility/dispatch/dispatcher";
import {
  acceptedDispatchCategories,
  getEntry,
  resetDispatchState,
} from "../src/lib/mobility/dispatch/dispatcher-store";
import { DEMO_DRIVER_ID } from "../src/lib/mobility/dispatch/demo-fleet";
import {
  clearTrip,
  createTrip,
  getTrip,
  patchTrip,
  transition,
} from "../src/lib/mobility/trip/trip-store";
import type { DispatchTripSnapshot } from "../src/lib/mobility/dispatch/dispatch-types";
import type { RideCategory } from "../src/lib/mobility/demo-fare";

const origin = { lat: -23.55, lng: -46.64, label: "Origem alternativas" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino alternativas" };

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
    keys: () => [...data.keys()],
  } as MemoryStorage;
}

function installBrowser() {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
}

function requestWithCategories(acceptedCategories: RideCategory[], category: RideCategory = acceptedCategories[0]) {
  createTrip({ origin, destination, userId: "lucas" });
  transition("embarque");
  transition("categoria");
  patchTrip({
    paymentMethod: "pix",
    estimatedFare: 22,
    category,
    acceptedCategories,
  });
  transition("buscando");
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  return trip;
}

beforeEach(() => {
  installBrowser();
  clearTrip();
  resetDispatchState();
  setDemoDispatcherConfig({ autoAccept: false, delayMs: 60_000 });
});

describe("despacho — alternativas em uma única solicitação", () => {
  test("a lista de alternativas reutiliza a categoria única quando não há seleção múltipla", () => {
    const single = { category: "conforto" } as DispatchTripSnapshot;
    const many = {
      category: "connexy",
      acceptedCategories: ["connexy", "moto"],
    } as DispatchTripSnapshot;
    expect(acceptedDispatchCategories(single)).toEqual(["conforto"]);
    expect(acceptedDispatchCategories(many)).toEqual(["connexy", "moto"]);
  });

  test("uma solicitação só despacha para as modalidades selecionadas", () => {
    const trip = requestWithCategories(["moto"]);
    expect(getEntry(trip.id)?.status).toBe("pending");
    expect(getEntry(trip.id)?.assigningDriverId).toBe("joao");
    expect(getEntry(trip.id)?.offer?.category).toBe("moto");
    expect(getTrip()?.id).toBe(trip.id);
  });

  test("Carro + Moto gera uma única entrada e prioriza o motorista demo elegível", () => {
    const trip = requestWithCategories(["conforto", "moto"], "conforto");
    expect(getEntry(trip.id)?.assigningDriverId).not.toBe(DEMO_DRIVER_ID);
    expect(getEntry(trip.id)?.offer?.category).toBe("conforto");
    expect(getTrip()?.acceptedCategories).toEqual(["conforto", "moto"]);
    clearTrip();
    resetDispatchState();
    const both = requestWithCategories(["connexy", "moto"]);
    expect(getEntry(both.id)?.assigningDriverId).toBe(DEMO_DRIVER_ID);
    expect(getEntry(both.id)?.offer?.category).toBe("connexy");
  });

  test("o primeiro aceite define a modalidade e impede um segundo vencedor", () => {
    const trip = requestWithCategories(["conforto", "moto"], "conforto");
    const driverId = getEntry(trip.id)?.assigningDriverId;
    expect(driverId).toBe("carla");
    expect(acceptRideOffer(trip.id, driverId ?? "")).toBe(true);
    expect(getTrip()?.status).toBe("encontrado");
    expect(getTrip()?.category).toBe("conforto");
    expect(getTrip()?.driver?.id).toBe("carla");
    expect(getEntry(trip.id)?.status).toBe("assigned");
    expect(acceptRideOffer(trip.id, "joao")).toBe(false);
    expect(getTrip()?.driver?.id).toBe("carla");
  });
});
