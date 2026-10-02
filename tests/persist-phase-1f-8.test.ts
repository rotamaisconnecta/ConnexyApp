import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CANONICAL_MOMENT_CATEGORY,
  CANONICAL_POST_PUBLISH_ROUTE,
  CREATE_TYPE_UNAVAILABLE_MESSAGE,
} from "../src/lib/create/create-hub-destinations";
import { demoStorageKey } from "../src/lib/demo/demo-config";
import { getDemoPosts, saveDemoPost, type DemoPost } from "../src/lib/demo/demo-posts";
import { resolveLocalEventById } from "../src/lib/marketplace/local-event-lookup";
import { findPlace } from "../src/lib/mock-data";
import { getBusinessById } from "../src/lib/marketplace/mock-businesses";
import { CREATE_MOMENT_REDIRECT_TO } from "../src/routes/_app/create/moment";

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

function momentPost(id: string): DemoPost {
  return {
    id,
    authorId: "lucas",
    authorName: "Lucas Almeida",
    authorPhoto: "https://example.com/lucas.jpg",
    authorHandle: "lucas.a",
    text: "Momento persistido da fase 1F-8",
    media: [],
    category: CANONICAL_MOMENT_CATEGORY,
    privacy: "PUBLIC",
    locationLabel: "Café Central",
    hashtags: [],
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  installBrowser();
});

describe("Fase 1F-8 — Momento reutiliza connexy:demo:posts", () => {
  test("criar momento persiste na chave de posts e sobrevive ao reload", () => {
    const post = momentPost("demo-post-1f-8-moment");
    saveDemoPost(post);

    expect(demoStorageKey("posts")).toBe("connexy:demo:posts");
    expect(getDemoPosts().map((item) => item.id)).toContain(post.id);
    expect(getDemoPosts().find((item) => item.id === post.id)?.category).toBe("MOMENT");

    reloadContext();
    const stored = getDemoPosts().find((item) => item.id === post.id);
    expect(stored?.id).toBe(post.id);
    expect(stored?.category).toBe(CANONICAL_MOMENT_CATEGORY);
    expect(window.localStorage.getItem("connexy:demo:moments")).toBeNull();
    expect(window.localStorage.getItem("connexy:demo:events")).toBeNull();
  });

  test("/create/moment aponta para o publicador canônico com categoria MOMENT", async () => {
    expect(CREATE_MOMENT_REDIRECT_TO).toBe(CANONICAL_POST_PUBLISH_ROUTE);
    const momentRoute = await source("src/routes/_app/create/moment.tsx");
    expect(momentRoute).toContain("redirect");
    expect(momentRoute).toContain("CANONICAL_MOMENT_CATEGORY");
    expect(momentRoute).not.toContain("CreateTypeUnavailable");
    expect(momentRoute).not.toContain("usePublisherForm");
    expect(momentRoute).not.toContain("supabase.from");

    const createPost = await source("src/routes/_app/create-post.tsx");
    expect(createPost).toContain("CANONICAL_MOMENT_CATEGORY");
    expect(createPost).toContain("initialCategory");
    expect(createPost).toContain("saveDemoPost");

    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).not.toContain('id: "moment"');
    expect(hub).not.toContain('route: "/create/moment"');
  });
});

describe("Fase 1F-8 — Evento, local, oferta e negócio não viram posts", () => {
  test("não mapeia momento/post para o catálogo nem cria stores paralelas por tipo", async () => {
    expect(CREATE_TYPE_UNAVAILABLE_MESSAGE).toContain("ainda não está disponível");
    expect(resolveLocalEventById("demo-post-1f-8-moment")).toBeUndefined();
    expect(findPlace("demo-post-1f-8-moment")).toBeUndefined();
    expect(getBusinessById("demo-post-1f-8-moment")).toBeUndefined();

    for (const file of [
      "src/routes/_app/create/event.tsx",
      "src/routes/_app/create/place.tsx",
      "src/routes/_app/create/offer.tsx",
      "src/routes/_app/create/place-business.tsx",
    ]) {
      const contents = await source(file);
      expect(contents).toContain("CatalogCreateForm");
      expect(contents).not.toContain("saveDemoPost");
      expect(contents).not.toContain("indexedDB");
      expect(contents).not.toContain("supabase.from");
      expect(contents).not.toContain("CreateTypeUnavailable");
    }

    const destinations = await source("src/lib/create/create-hub-destinations.ts");
    expect(destinations).not.toContain("indexedDB");
    expect(destinations).not.toContain("localStorage");
    expect(destinations).not.toContain("EventRepository");
    expect(destinations).not.toContain("PlaceRepository");
  });
});
