import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MORE_MENU_LABELS } from "../src/lib/navigation/more-menu";
import {
  getHomeDiscoveryNavigation,
  hasMoreNearby,
  listConnectPulseItems,
  listHomeDiscoveryItems,
  listNearbyYouItems,
  NEARBY_PAGE_SIZE,
  paginateNearby,
} from "../src/lib/home/home-discovery";
import { isBusinessReservable, isPlaceReservable } from "../src/lib/reservations/reservable";
import {
  cancelReservation,
  createReservation,
  listReservations,
  RESERVATIONS_STORAGE_KEY,
  ReservationResourceType,
} from "../src/lib/reservations/reservation-store";
import {
  acceptCaronaRequest,
  CARONA_STORAGE_KEY,
  createCaronaOffer,
  getCaronaOffer,
  listDiscoverableCaronaOffers,
  listMyCaronaOffers,
  requestCarona,
} from "../src/lib/carona/carona-store";
import { getAllBusinesses } from "../src/lib/marketplace/mock-businesses";
import { places } from "../src/lib/mock-data";
import { getDemoIdentity, setDemoIdentity } from "../src/lib/demo/demo-identity";
import { getConnectionBetween } from "../src/lib/demo/demo-db";

const projectRoot = join(import.meta.dir, "..");
const A = "lucas";
const B = "beatriz";

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

function reloadContext(): MemoryStorage {
  const current = (globalThis as { window?: { localStorage: MemoryStorage } }).window?.localStorage;
  const snapshot = new Map<string, string>();
  if (current) {
    for (const key of current.keys()) {
      const value = current.getItem(key);
      if (value != null) snapshot.set(key, value);
    }
  }
  return installBrowser(createMemoryStorage(snapshot));
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

beforeEach(() => {
  installBrowser();
  setDemoIdentity(A);
});

describe("Fase 1H-2 — Connexy Pulse unificado", () => {
  test("Pulse projeta catálogo e fixtures sem criar store paralelo", () => {
    const items = listConnectPulseItems();
    const kinds = new Set(items.map((item) => item.kind));
    expect(items.length).toBeGreaterThan(0);
    expect(kinds.has("business")).toBe(true);
    expect(kinds.has("event")).toBe(true);
    expect(items.every((item) => item.image.length > 0)).toBe(true);
    expect(items.every((item) => getHomeDiscoveryNavigation(item) != null)).toBe(true);
    expect(window.localStorage.getItem("connexy:demo:pulse")).toBeNull();
  });

  test("paginação do catálogo existente continua 5 em 5 sem duplicar", () => {
    const all = listHomeDiscoveryItems();
    expect(all.length).toBeGreaterThan(NEARBY_PAGE_SIZE);
    const first = paginateNearby(all, NEARBY_PAGE_SIZE);
    const second = paginateNearby(all, NEARBY_PAGE_SIZE * 2);
    expect(first).toHaveLength(5);
    expect(second).toHaveLength(10);
    expect(new Set(second.map((item) => item.id)).size).toBe(10);
    expect(second.slice(0, 5)).toEqual(first);
    expect(hasMoreNearby(all.length, 5)).toBe(true);
    expect(all.map((item) => item.distanceMeters)).toEqual(
      [...all].map((item) => item.distanceMeters).sort((a, b) => a - b),
    );
  });

  test("Pulse absorve o catálogo próximo sem duplicar itens", () => {
    const pulse = listConnectPulseItems();
    const nearby = listNearbyYouItems().filter((item) => Boolean(item.image));
    const pulseIds = pulse.map((item) => item.id);
    expect(new Set(pulseIds).size).toBe(pulseIds.length);
    expect(nearby.slice(0, NEARBY_PAGE_SIZE).every((item) => pulseIds.includes(item.id))).toBe(
      true,
    );
  });

  test("Home não renderiza seção independente Perto de você e o Pulse navega", async () => {
    expect([...MORE_MENU_LABELS]).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    const pulse = await source("src/components/home/ConnexyPulse.tsx");
    expect(pulse).toContain("Connexy Pulse");
    expect(pulse).toContain("Tudo o que importa ao seu redor.");
    expect(pulse).not.toContain("Connect Pulse");
    expect(pulse).not.toContain("Perto de você");
    expect(pulse).not.toContain("NearbyYouList");
    expect(pulse).toContain("getHomeDiscoveryNavigation");
    expect(pulse).toContain("aria-label");
    expect(pulse).not.toContain('to="/perfil/$id"');
    expect(pulse).not.toContain('href="#"');
    const home = await source("src/routes/_app.home.tsx");
    expect(home).toContain("ConnexyPulse");
    expect(home).toContain("FeedNearbyPeople");
    expect(home).toContain("HomeActionHub");
    expect(home).not.toContain("NearbyYouList");
    expect(home).not.toContain("perto-de-voce-title");
  });
});

describe("Fase 1H-2 — Reserva local", () => {
  test("cria, confirma, recarrega e isola por identidade", () => {
    const business = getAllBusinesses().find(isBusinessReservable);
    const place = places.find(isPlaceReservable);
    expect(business).toBeDefined();
    expect(place).toBeDefined();
    const reservation = createReservation({
      resourceId: business!.id,
      resourceType: ReservationResourceType.BUSINESS,
      resourceName: business!.name,
      date: "2026-09-24",
      time: "19:30",
      partySize: 2,
      userId: A,
    });
    expect(reservation.status).toBe("confirmed");
    expect(listReservations(A)).toHaveLength(1);
    expect(listReservations(B)).toHaveLength(0);

    reloadContext();
    setDemoIdentity(A);
    expect(listReservations(A)[0]?.id).toBe(reservation.id);
    expect(window.localStorage.getItem(RESERVATIONS_STORAGE_KEY)).toContain(reservation.id);

    cancelReservation(reservation.id, A);
    expect(listReservations(A)[0]?.status).toBe("cancelled");
    expect(window.localStorage.getItem("connexy:demo:restaurant-reservations")).toBeNull();
  });
});

describe("Fase 1H-2 — Carona Amiga", () => {
  test("ofertar, solicitar, aceitar, conversar e recarregar", async () => {
    const offer = createCaronaOffer({
      origin: "Av. Paulista, 1578",
      destination: "Parque Ibirapuera, portão 3",
      date: "2026-09-24",
      time: "19:30",
      availableSeats: 2,
      ownerId: A,
    });
    expect(offer.origin).toBe("Av. Paulista");
    expect(offer.destination).toBe("Parque Ibirapuera");
    expect(listMyCaronaOffers(A)).toHaveLength(1);
    expect(listDiscoverableCaronaOffers(A)).toHaveLength(0);
    expect(listDiscoverableCaronaOffers(B)).toHaveLength(1);

    const request = requestCarona(offer.id, B);
    expect(request.status).toBe("requested");
    const accepted = await acceptCaronaRequest(request.id, A);
    expect(accepted.status).toBe("accepted");
    expect(accepted.conversationId).toBeTruthy();
    expect(getCaronaOffer(offer.id)?.availableSeats).toBe(1);
    expect(getConnectionBetween(A, B)?.conversationId).toBe(accepted.conversationId);

    reloadContext();
    setDemoIdentity(A);
    expect(getCaronaOffer(offer.id)?.status).toBe("active");
    expect(window.localStorage.getItem(CARONA_STORAGE_KEY)).toContain(offer.id);
    expect(window.localStorage.getItem("connexy_demo_trip")).toBeNull();
  });
});

describe("Fase 1H-2 — regressão de fontes", () => {
  test("não cria IndexedDB nem rota /agora", async () => {
    const pulse = await source("src/lib/home/home-discovery.ts");
    expect(pulse).toContain("mergeCatalogPlaces");
    expect(pulse).toContain("getAllBusinesses");
    expect(pulse).not.toContain("indexedDB");
    const carona = await source("src/lib/carona/carona-store.ts");
    expect(carona).toContain("connectUser");
    expect(carona).not.toContain("RideChatRepository");
    const dispatcher = await source("src/lib/mobility/dispatch/dispatcher.ts");
    expect(dispatcher).not.toContain("createCaronaOffer");
    const identity = getDemoIdentity();
    expect(identity.id).toBe(A);
    const detail = await source("src/routes/_app/carona.$offerId.tsx");
    expect(detail).toContain("Conversar");
    expect(detail).toContain("Ver ponto de encontro");
    expect(detail).toContain("Cancelar");
  });
});
