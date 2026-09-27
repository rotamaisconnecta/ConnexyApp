import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  acceptRideOffer,
  cancelDriverAssignment,
  hydrateDispatcherFromTrip,
  setDemoDispatcherConfig,
} from "../src/lib/mobility/dispatch/dispatcher";
import {
  getActiveAssignmentForDriver,
  getAssignedDriver,
  getDispatchSnapshot,
  getDriverById,
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

const projectRoot = join(import.meta.dir, "..");
const origin = { lat: -23.55, lng: -46.64, label: "Origem 1F-9" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino 1F-9" };

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(seed?: Map<string, string>): MemoryStorage {
  const data = seed ? new Map(seed) : new Map<string, string>();
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

function installBrowser(storage: MemoryStorage = createMemoryStorage()): MemoryStorage {
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
  return storage;
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function reachSearching(): NonNullable<ReturnType<typeof getTrip>> {
  createTrip({ origin, destination, userId: "lucas" });
  transition("embarque");
  transition("categoria");
  patchTrip({ paymentMethod: "pix", estimatedFare: 22 });
  transition("buscando");
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  return trip;
}

function acceptCurrentOffer(): string {
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  const driverId = getEntry(trip.id)?.assigningDriverId;
  if (!driverId) throw new Error("Oferta ausente");
  const accepted = acceptRideOffer(trip.id, driverId);
  if (!accepted) throw new Error("Aceite recusado");
  return driverId;
}

beforeEach(() => {
  installBrowser();
  clearTrip();
  resetDispatchState();
  setDemoDispatcherConfig({ autoAccept: false, delayMs: 60_000 });
});

describe("Fase 1F-9 — Dispatcher deriva da Trip após perda de memória", () => {
  test("buscando recria a oferta canônica sem chave nova", () => {
    const trip = reachSearching();
    expect(getEntry(trip.id)?.status).toBe("pending");
    expect(getEntry(trip.id)?.assigningDriverId).toBe(DEMO_DRIVER_ID);

    resetDispatchState();
    expect(getEntry(trip.id)).toBeUndefined();
    hydrateDispatcherFromTrip();

    expect(getTrip()?.id).toBe(trip.id);
    expect(getTrip()?.status).toBe("buscando");
    expect(getEntry(trip.id)?.status).toBe("pending");
    expect(getEntry(trip.id)?.assigningDriverId).toBe(DEMO_DRIVER_ID);
    expect(window.localStorage.getItem("connexy_demo_trip")).toContain(trip.id);
    expect(window.localStorage.getItem("connexy:demo:dispatch")).toBeNull();
  });

  test("atribuição aceita é reconstruída a partir de trip.driver", () => {
    const trip = reachSearching();
    const driverId = acceptCurrentOffer();
    expect(getTrip()?.status).toBe("encontrado");
    expect(getTrip()?.driver?.id).toBe(driverId);
    expect(getAssignedDriver(trip.id)?.id).toBe(driverId);

    resetDispatchState();
    expect(getAssignedDriver(trip.id)).toBeNull();
    expect(getActiveAssignmentForDriver(driverId)).toBeUndefined();
    expect(getDriverById(driverId)?.status).toBe("available");

    hydrateDispatcherFromTrip();
    expect(getEntry(trip.id)?.status).toBe("assigned");
    expect(getEntry(trip.id)?.assignedDriverId).toBe(driverId);
    expect(getAssignedDriver(trip.id)?.id).toBe(driverId);
    expect(getActiveAssignmentForDriver(driverId)?.tripId).toBe(trip.id);
    expect(getDriverById(driverId)?.status).toBe("accepted");
  });

  test("corrida em andamento restaura o motorista como busy e permite cancelar", () => {
    reachSearching();
    const driverId = acceptCurrentOffer();
    transition("chegando");
    transition("chegou");
    transition("emviagem");
    const trip = getTrip();
    if (!trip) throw new Error("Trip ausente");
    expect(trip.driver?.id).toBe(driverId);

    resetDispatchState();
    hydrateDispatcherFromTrip();
    expect(getEntry(trip.id)?.status).toBe("assigned");
    expect(getDriverById(driverId)?.status).toBe("busy");

    cancelDriverAssignment(trip.id, driverId);
    expect(getTrip()?.status).toBe("cancelada");
    expect(getTrip()?.cancelledBy).toBe("driver");
    expect(getEntry(trip.id)?.status).toBe("cancelled");
  });

  test("conclusão não recria atribuição e a política demo permanece só na chave existente", () => {
    reachSearching();
    acceptCurrentOffer();
    transition("chegando");
    transition("chegou");
    transition("emviagem");
    transition("chegada");
    transition("avaliacao");
    patchTrip({ paymentConfirmed: true });
    transition("conclusao");
    const trip = getTrip();
    if (!trip) throw new Error("Trip ausente");

    resetDispatchState();
    hydrateDispatcherFromTrip();
    expect(getEntry(trip.id)?.status).not.toBe("assigned");
    expect(getActiveAssignmentForDriver(DEMO_DRIVER_ID)).toBeUndefined();
    expect(getDispatchSnapshot().fleet.every((driver) => driver.status === "available")).toBe(true);

    setDemoDispatcherConfig({ autoAccept: false, delayMs: 60_000 });
    const raw = window.localStorage.getItem("connexy_demo_dispatcher");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(String(raw)) as Record<string, unknown>;
    expect(parsed.autoAccept).toBe(false);
    expect(parsed.entries).toBeUndefined();
    expect(parsed.fleet).toBeUndefined();
  });
});

describe("Fase 1F-9 — autoridade e ausência de persistência paralela", () => {
  test("Trip permanece a fonte e o dispatcher não ganha store nova", async () => {
    const integration = await source("src/lib/mobility/dispatch/dispatcher.ts");
    expect(integration).toContain("hydrateDispatcherFromTrip");
    expect(integration).toContain("restoreAssignment");
    expect(integration).not.toContain("DispatcherRepository");
    expect(integration).not.toContain("indexedDB");

    const store = await source("src/lib/mobility/dispatch/dispatcher-store.ts");
    expect(store).toContain("restoreAssignment");
    expect(store).not.toContain("localStorage");
    expect(store).not.toContain("connexy_demo_trip");

    const tripStore = await source("src/lib/mobility/trip/trip-store.ts");
    expect(tripStore).toContain('const STORAGE_KEY = "connexy_demo_trip"');
  });
});
