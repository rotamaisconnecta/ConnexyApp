import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CatalogKind,
  LOCAL_CATALOG_DISCLAIMER,
  LOCAL_CATALOG_STORAGE_KEY,
  createCatalogBusiness,
  createCatalogEvent,
  createCatalogOffer,
  createCatalogPlace,
  getCatalogEntity,
  listCatalogByKind,
  listCatalogEntities,
  mergeCatalogPlaces,
} from "../src/lib/catalog/local-catalog";
import { demoStorageKey } from "../src/lib/demo/demo-config";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import { getDiscoverItemNavigation } from "../src/lib/discovery/discover-navigation";
import { resolveLocalEventById } from "../src/lib/marketplace/local-event-lookup";
import { BusinessCategory } from "../src/lib/marketplace/business-types";
import { getAllBusinesses, getBusinessById } from "../src/lib/marketplace/mock-businesses";
import { places } from "../src/lib/mock-data";

const projectRoot = join(import.meta.dir, "..");

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
});

describe("Fase 1F-12 — um store de catálogo local, sem backend", () => {
  test("persiste evento, local, negócio e oferta na chave canônica e sobrevive ao reload", () => {
    const ownerId = getDemoIdentity().id;
    const event = createCatalogEvent({
      title: "Sarau 1F-12",
      description: "Leitura local",
      location: "Praça da República",
      startAt: "2026-10-01T20:00",
      endAt: "2026-10-01T22:00",
      capacity: 40,
    });
    const place = createCatalogPlace({
      name: "Ateliê 1F-12",
      category: "Lojas",
      address: "Rua Augusta, 100",
      description: "Espaço de ateliê",
      hours: "10:00–18:00",
    });
    const business = createCatalogBusiness({
      name: "Padaria 1F-12",
      category: BusinessCategory.CAFE,
      address: "Rua Oscar Freire, 50",
      description: "Pães e café",
    });
    const offer = createCatalogOffer({
      businessId: business.id,
      title: "Pão 20%",
      description: "Desconto local",
      discountValue: 20,
      validUntil: "2026-10-31T23:59:00",
    });

    expect(LOCAL_CATALOG_STORAGE_KEY).toBe("connexy:demo:catalog");
    expect(demoStorageKey("catalog")).toBe(LOCAL_CATALOG_STORAGE_KEY);
    expect(event.ownerId).toBe(ownerId);
    expect(place.ownerId).toBe(ownerId);
    expect(business.ownerId).toBe(ownerId);
    expect(offer.ownerId).toBe(ownerId);
    expect(event.id.startsWith("event-")).toBe(true);
    expect(place.id.startsWith("place-")).toBe(true);
    expect(business.id.startsWith("business-")).toBe(true);
    expect(offer.id.startsWith("offer-")).toBe(true);
    expect(offer.businessId).toBe(business.id);
    expect(window.localStorage.getItem("connexy:demo:events")).toBeNull();
    expect(window.localStorage.getItem("connexy:demo:places")).toBeNull();
    expect(window.localStorage.getItem("connexy:demo:posts")).toBeNull();

    reloadContext();
    expect(getCatalogEntity(event.id)?.id).toBe(event.id);
    expect(getCatalogEntity(place.id)?.kind).toBe(CatalogKind.PLACE);
    expect(listCatalogByKind(CatalogKind.BUSINESS, ownerId).map((item) => item.id)).toContain(
      business.id,
    );
    expect(
      listCatalogEntities()
        .map((item) => item.id)
        .sort(),
    ).toEqual([event.id, place.id, business.id, offer.id].sort());
    expect(resolveLocalEventById(event.id)?.id).toBe(event.id);
    expect(mergeCatalogPlaces(places).some((item) => item.id === place.id)).toBe(true);
    expect(getBusinessById(business.id)?.id).toBe(business.id);
    expect(
      getAllBusinesses()
        .find((item) => item.id === business.id)
        ?.promotions.some((item) => item.id === offer.id),
    ).toBe(true);
    expect(
      getDiscoverItemNavigation({ id: event.id, type: "eventos", targetId: event.id }),
    ).toEqual({
      to: "/event/$eventId",
      params: { eventId: event.id },
    });
    expect(
      getDiscoverItemNavigation({ id: business.id, type: "negocios", targetId: business.id }),
    ).toEqual({
      to: "/business/$businessId",
      params: { businessId: business.id },
    });
    expect(getDiscoverItemNavigation({ id: place.id, type: "locais" })).toEqual({
      to: "/local/$id",
      params: { id: place.id },
    });
  });

  test("oferta exige negócio e não aceita outro kind como host", () => {
    const place = createCatalogPlace({
      name: "Galeria 1F-12",
      category: "Lojas",
      address: "Rua da Consolação, 10",
      description: "Galeria",
    });
    expect(() =>
      createCatalogOffer({
        businessId: place.id,
        title: "Oferta inválida",
        description: "Não deve persistir",
        discountValue: 15,
        validUntil: "2026-11-01T23:59:00",
      }),
    ).toThrow("A oferta precisa de um negócio existente.");
    expect(listCatalogByKind(CatalogKind.OFFER)).toHaveLength(0);

    const offer = createCatalogOffer({
      businessId: "b1",
      title: "Menu 10%",
      description: "Sobre fixture",
      discountValue: 10,
      validUntil: "2026-11-01T23:59:00",
    });
    expect(offer.businessId).toBe("b1");
    expect(getBusinessById("b1")?.promotions.some((item) => item.id === offer.id)).toBe(true);
  });

  test("Create e detalhes usam o store único, sem repositories paralelos", async () => {
    expect(LOCAL_CATALOG_DISCLAIMER).toContain("Cadastro local/demo");
    const store = await source("src/lib/catalog/local-catalog.ts");
    expect(store).toContain('demoStorageKey("catalog")');
    expect(store).not.toContain("indexedDB");
    expect(store).not.toContain("supabase");
    expect(store).not.toContain("EventRepository");
    expect(store).not.toContain("PlaceRepository");
    expect(store).not.toContain("OfferRepository");
    expect(store).not.toContain("BusinessRepository");

    for (const file of [
      "src/routes/_app/create/event.tsx",
      "src/routes/_app/create/place.tsx",
      "src/routes/_app/create/offer.tsx",
      "src/routes/_app/create/place-business.tsx",
    ]) {
      const contents = await source(file);
      expect(contents).toContain("CatalogCreateForm");
      expect(contents).not.toContain("CreateTypeUnavailable");
      expect(contents).not.toContain("saveDemoPost");
      expect(contents).not.toContain("indexedDB");
      expect(contents).not.toContain("supabase.from");
    }

    const eventDetail = await source("src/routes/_app/event.$eventId.tsx");
    const placeDetail = await source("src/routes/_app.local.$id.tsx");
    const businessDetail = await source("src/routes/_app/business.$businessId.tsx");
    expect(eventDetail).toContain("ssr: false");
    expect(eventDetail).toContain("resolveLocalEventById");
    expect(placeDetail).toContain("ssr: false");
    expect(placeDetail).toContain("mergeCatalogPlaces");
    expect(businessDetail).toContain("ssr: false");
    expect(businessDetail).toContain("getBusinessById");
  });
});
