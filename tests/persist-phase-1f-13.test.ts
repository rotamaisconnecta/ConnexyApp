import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CatalogKind,
  LOCAL_CATALOG_STORAGE_KEY,
  catalogEntityLabel,
  createCatalogBusiness,
  createCatalogEvent,
  createCatalogOffer,
  createCatalogPlace,
  getCatalogEntity,
  listCatalogByKind,
  mergeCatalogPlaces,
} from "../src/lib/catalog/local-catalog";
import { demoStorageKey } from "../src/lib/demo/demo-config";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import { MORE_MENU_ITEMS, MORE_MENU_LABELS } from "../src/lib/navigation/more-menu";
import { SAVED_DETAILS_STORAGE_KEY } from "../src/lib/marketplace/saved-details";
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

describe("Fase 1F-13 — menu Mais", () => {
  test("contém exatamente Locais, Eventos, Negócios, Agora, Ofertas e Gerenciar", async () => {
    expect([...MORE_MENU_LABELS]).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    expect(MORE_MENU_ITEMS).toHaveLength(6);
    expect(MORE_MENU_ITEMS.map((item) => item.to)).toEqual([
      "/locais",
      "/events",
      "/marketplace",
      "/reels",
      "/marketplace",
      "/gerenciar",
    ]);

    const profile = await source("src/routes/_app.profile.tsx");
    expect(profile).toContain("MORE_MENU_ITEMS");
    expect(profile).toContain('aria-label="Mais"');
    expect(profile).toContain("MORE_MENU_ITEMS.map");
    const menuModule = await source("src/lib/navigation/more-menu.ts");
    for (const extra of [
      "Pessoas",
      "Conversas",
      "Perfil",
      "Configurações",
      "Notificações",
      "Criar",
      "Mapa",
      "Home",
      "Ajuda",
      "Compartilhar",
    ]) {
      expect(menuModule).not.toContain(`"${extra}"`);
    }
  });
});

describe("Fase 1F-13 — catálogo local fechado", () => {
  test("os quatro tipos persistem no store único, com owner canônico, e sobrevivem ao reload", () => {
    const ownerId = getDemoIdentity().id;
    expect(ownerId).toBe("lucas");
    const event = createCatalogEvent({
      title: "Sarau 1F-13",
      description: "Fechamento",
      location: "Praça da República",
      startAt: "2026-10-08T20:00",
      endAt: "2026-10-08T22:00",
    });
    const place = createCatalogPlace({
      name: "Ateliê 1F-13",
      category: "Lojas",
      address: "Rua Augusta, 300",
      description: "Espaço local",
    });
    const business = createCatalogBusiness({
      name: "Padaria 1F-13",
      category: BusinessCategory.CAFE,
      address: "Rua Oscar Freire, 90",
      description: "Café local",
    });
    const offer = createCatalogOffer({
      businessId: business.id,
      title: "Café 12%",
      description: "Oferta no negócio persistido",
      discountValue: 12,
      validUntil: "2026-11-20T23:59:00",
    });

    expect(LOCAL_CATALOG_STORAGE_KEY).toBe("connexy:demo:catalog");
    expect(demoStorageKey("posts")).toBe("connexy:demo:posts");
    expect(event.ownerId).toBe(ownerId);
    expect(place.ownerId).toBe(ownerId);
    expect(business.ownerId).toBe(ownerId);
    expect(offer.ownerId).toBe(ownerId);
    expect(offer.businessId).toBe(business.id);
    expect(offer.businessId.startsWith("business-")).toBe(true);
    expect(listCatalogByKind(CatalogKind.EVENT, "beatriz")).toHaveLength(0);
    expect(window.localStorage.getItem(SAVED_DETAILS_STORAGE_KEY)).toBeNull();

    reloadContext();
    expect(resolveLocalEventById(event.id)?.title).toBe("Sarau 1F-13");
    expect(mergeCatalogPlaces(places).some((item) => item.id === place.id)).toBe(true);
    expect(getBusinessById(business.id)?.id).toBe(business.id);
    expect(
      getAllBusinesses()
        .find((item) => item.id === business.id)
        ?.promotions.some((item) => item.id === offer.id),
    ).toBe(true);
    expect(getCatalogEntity(offer.id)?.kind).toBe(CatalogKind.OFFER);
    expect(catalogEntityLabel(getCatalogEntity(event.id)!)).toBe("Sarau 1F-13");
    expect(places.some((item) => item.id === "cafe-central")).toBe(true);
    expect(getBusinessById("b1")?.id).toBe("b1");
  });

  test("overlay do catálogo não deixa fixture substituir entidade persistida com o mesmo id", () => {
    const now = Date.now();
    window.localStorage.setItem(
      LOCAL_CATALOG_STORAGE_KEY,
      JSON.stringify([
        {
          id: "cafe-central",
          kind: CatalogKind.PLACE,
          ownerId: getDemoIdentity().id,
          createdAt: now,
          updatedAt: now,
          name: "Café persistido 1F-13",
          category: "Cafés",
          address: "Endereço do usuário",
          description: "Não deve voltar ao fixture",
        },
      ]),
    );
    const merged = mergeCatalogPlaces(places).filter((item) => item.id === "cafe-central");
    expect(merged).toHaveLength(1);
    expect(merged[0]?.name).toBe("Café persistido 1F-13");
  });

  test("não há edição, exclusão, store paralelo nem posts misturados", async () => {
    const store = await source("src/lib/catalog/local-catalog.ts");
    expect(store).not.toContain("updateCatalog");
    expect(store).not.toContain("deleteCatalog");
    expect(store).not.toContain("indexedDB");
    expect(store).not.toContain("supabase");
    expect(store).not.toContain("EventRepository");
    expect(store).toContain("getDemoIdentity().id");
    expect(store).not.toContain("currentUser");

    const gerenciar = await source("src/routes/_app.gerenciar.tsx");
    expect(gerenciar).toContain("ownedCatalogItems");
    expect(gerenciar).toContain("Catálogo local");
    expect(gerenciar).not.toContain("cafe-central");

    const createPost = await source("src/routes/_app/create-post.tsx");
    expect(createPost).toContain("saveDemoPost");
    expect(createPost).not.toContain("createCatalogEvent");
  });
});
