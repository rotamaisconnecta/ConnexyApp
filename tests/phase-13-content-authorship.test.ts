import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { setDemoEnabledForTests } from "../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../src/lib/demo/demo-identity";
import { getDemoPosts, saveDemoPost, type DemoPost } from "../src/lib/demo/demo-posts";

const LUCAS = "lucas";
const BEATRIZ = "beatriz";
const projectRoot = join(import.meta.dir, "..");

type MemoryStorage = Storage;

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
  } as MemoryStorage;
}

function installBrowser(): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: createMemoryStorage(),
      sessionStorage: createMemoryStorage(),
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function demoPost(authorId: string): DemoPost {
  const author = getDemoIdentity();
  return {
    id: `post-${authorId}`,
    authorId,
    authorName: author.name,
    authorPhoto: author.photo,
    authorHandle: "@autor",
    text: "Conteúdo da Fase 13",
    media: [],
    category: "LIFESTYLE",
    privacy: "public",
    locationLabel: null,
    hashtags: [],
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  installBrowser();
  setDemoEnabledForTests(true);
  setDemoIdentity(LUCAS);
});

afterEach(() => {
  setDemoIdentity(LUCAS);
  setDemoEnabledForTests(null);
});

describe("Fase 13 — autoria do conteúdo", () => {
  test("identidade A cria conteúdo com authorId A", async () => {
    const createPost = await source("src/routes/_app/create-post.tsx");
    expect(createPost).not.toContain("authorId: currentUser.id");
    expect(createPost).toMatch(/authorId:\s*getDemoIdentity\(\)\.id/);

    setDemoIdentity(LUCAS);
    const post = demoPost(getDemoIdentity().id);
    saveDemoPost(post);
    expect(getDemoPosts()[0]?.authorId).toBe(LUCAS);
  });

  test("identidade B cria conteúdo com authorId B", () => {
    setDemoIdentity(BEATRIZ);
    const post = demoPost(getDemoIdentity().id);
    saveDemoPost(post);
    expect(getDemoPosts()[0]?.authorId).toBe(BEATRIZ);
  });

  test("B visualiza conteúdo de A sem reatribuir sua autoria", () => {
    setDemoIdentity(LUCAS);
    const post = demoPost(getDemoIdentity().id);
    saveDemoPost(post);

    setDemoIdentity(BEATRIZ);
    const viewedPost = getDemoPosts()[0];
    expect(viewedPost?.authorId).toBe(LUCAS);
  });

  test("abrir o autor do conteúdo aponta ao perfil usando authorId de A", async () => {
    const post = demoPost(LUCAS);
    const happeningNow = await source("src/lib/home/happening-now.ts");
    expect(post.authorId).toBe(LUCAS);
    expect(happeningNow).toContain('target: { to: "/perfil/$id" as const, params: { id: post.authorId } }');
  });
});
