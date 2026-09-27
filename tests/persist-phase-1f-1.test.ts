import { beforeEach, describe, expect, test } from "bun:test";
import { filterNearbyPlaces, places } from "../src/lib/mock-data";
import {
  getDiscoverItemNavigation,
  discoverEventIdFromItem,
} from "../src/lib/discovery/discover-navigation";
import {
  listLocalEvents,
  listNearbyPlaceEvents,
  resolveLocalEventById,
} from "../src/lib/marketplace/local-event-lookup";
import {
  isDetailSaved,
  listSavedDetailIds,
  SAVED_DETAILS_STORAGE_KEY,
  toggleSavedDetail,
} from "../src/lib/marketplace/saved-details";

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
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(String(key), String(value));
    },
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

beforeEach(() => {
  installBrowser();
});

describe("Fase 1F-1 — busca de /locais", () => {
  test("busca por nome filtra o catálogo atual", () => {
    const result = filterNearbyPlaces(places, "Burger");
    expect(result.map((place) => place.id)).toEqual(["burger-house"]);
    expect(result[0]?.name).toBe("Burger House");
  });

  test("busca ignora maiúsculas, minúsculas e espaços extras", () => {
    expect(filterNearbyPlaces(places, "  burger ").map((place) => place.id)).toEqual([
      "burger-house",
    ]);
    expect(filterNearbyPlaces(places, "CAFÉ").map((place) => place.id)).toEqual(["cafe-central"]);
  });

  test("busca vazia restaura o filtro atual", () => {
    expect(filterNearbyPlaces(places, "   ").map((place) => place.id)).toEqual(
      places.map((place) => place.id),
    );
    expect(filterNearbyPlaces(places, "", "Cafés").map((place) => place.id)).toEqual([
      "cafe-central",
    ]);
  });

  test("busca e filtro de categoria funcionam juntos", () => {
    expect(filterNearbyPlaces(places, "Burger", "Restaurantes").map((place) => place.id)).toEqual([
      "burger-house",
    ]);
    expect(filterNearbyPlaces(places, "Burger", "Cafés")).toEqual([]);
    expect(filterNearbyPlaces(places, "Central", "Cafés").map((place) => place.id)).toEqual([
      "cafe-central",
    ]);
  });

  test("nenhum resultado devolve lista vazia", () => {
    expect(filterNearbyPlaces(places, "xyzzy-inexistente")).toEqual([]);
  });
});

describe("Fase 1F-1 — eventos do Discover", () => {
  test("Sunset aparece no catálogo de eventos do Discover", () => {
    const events = listNearbyPlaceEvents();
    expect(events.some((event) => event.id === "sunset-parque")).toBe(true);
    expect(events.find((event) => event.id === "sunset-parque")?.title).toBe("Sunset no Parque");
  });

  test("clicar no evento navega para o detalhe existente", () => {
    const item = {
      id: "evt-sunset-parque",
      type: "eventos" as const,
      targetId: "sunset-parque",
    };
    expect(discoverEventIdFromItem(item)).toBe("sunset-parque");
    expect(getDiscoverItemNavigation(item)).toEqual({
      to: "/event/$eventId",
      params: { eventId: "sunset-parque" },
    });
  });

  test("o detalhe abre com os dados do catálogo existente", () => {
    const event = resolveLocalEventById("sunset-parque");
    expect(event?.id).toBe("sunset-parque");
    expect(event?.title).toBe("Sunset no Parque");
    expect(event?.photo).toBeTruthy();
    expect(event?.location).toContain("Ibirapuera");
    expect(listLocalEvents().some((item) => item.id === "ev1")).toBe(true);
    expect(resolveLocalEventById("ev1")?.title).toBe("Sunset no Parque");
  });

  test("voltar do detalhe usa o histórico e o fallback de eventos", () => {
    expect(getDiscoverItemNavigation({ id: "evt-sunset-parque", type: "eventos" })).toEqual({
      to: "/event/$eventId",
      params: { eventId: "sunset-parque" },
    });
    expect(getDiscoverItemNavigation({ id: "cafe-central", type: "locais" })?.to).toBe("/local/$id");
  });
});

describe("Fase 1F-1 — favorito de negócio", () => {
  test("usa a persistência canônica já existente", () => {
    expect(SAVED_DETAILS_STORAGE_KEY).toBe("connexy:demo:saved-details");
  });

  test("favoritar, desfavoritar e reload não duplicam", () => {
    expect(toggleSavedDetail("b1")).toBe(true);
    expect(isDetailSaved("b1")).toBe(true);
    expect(listSavedDetailIds()).toEqual(["b1"]);
    window.localStorage.setItem(SAVED_DETAILS_STORAGE_KEY, JSON.stringify(["b1", "b1"]));
    expect(listSavedDetailIds()).toEqual(["b1"]);
    expect(JSON.parse(window.localStorage.getItem(SAVED_DETAILS_STORAGE_KEY) ?? "[]")).toEqual([
      "b1",
      "b1",
    ]);

    reloadContext();
    expect(isDetailSaved("b1")).toBe(true);
    expect(listSavedDetailIds()).toEqual(["b1"]);

    expect(toggleSavedDetail("b1")).toBe(false);
    reloadContext();
    expect(isDetailSaved("b1")).toBe(false);
    expect(listSavedDetailIds()).toEqual([]);
    expect(window.localStorage.getItem("connexy:demo:business-favorites")).toBeNull();
  });
});
