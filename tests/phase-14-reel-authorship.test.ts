import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { setDemoEnabledForTests } from "../src/lib/demo/demo-config";
import { setDemoIdentity } from "../src/lib/demo/demo-identity";
import { buildPublishedReel } from "../src/lib/reels/reel-feed";
import { buildReelAuthorFromCurrentUser } from "../src/lib/reels/reel-publish";
import { getReelContext } from "../src/lib/reels/reel-context";
import { ReelCategory, type Reel } from "../src/lib/reels/reel-types";

const LUCAS = "lucas";
const BEATRIZ = "beatriz";

function installBrowser(): void {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
  } as Storage;
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
}

function storedReel(authorId: string) {
  const author = buildReelAuthorFromCurrentUser();
  return {
    id: `reel-${authorId}`,
    caption: "Um momento local",
    category: ReelCategory.MOMENT,
    author: { ...author, id: authorId },
    context: null,
    durationS: 5,
    createdAt: new Date().toISOString(),
    persistence: "local" as const,
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

describe("Fase 14 — autoria e navegação de Reels", () => {
  test("identidade A cria Reel atribuído a A", () => {
    setDemoIdentity(LUCAS);
    expect(buildReelAuthorFromCurrentUser().id).toBe(LUCAS);
  });

  test("identidade B cria Reel atribuído a B", () => {
    setDemoIdentity(BEATRIZ);
    expect(buildReelAuthorFromCurrentUser().id).toBe(BEATRIZ);
  });

  test("B visualiza Reel de A sem trocar o autor persistido", () => {
    setDemoIdentity(LUCAS);
    const saved = storedReel(buildReelAuthorFromCurrentUser().id);

    setDemoIdentity(BEATRIZ);
    const viewed = buildPublishedReel(saved, "/video.webm", null);
    expect(viewed.author.id).toBe(LUCAS);
  });

  test("abrir o autor do Reel leva ao perfil A gravado", () => {
    setDemoIdentity(LUCAS);
    const published = buildPublishedReel(storedReel(LUCAS), "/video.webm", null);
    const reel = {
      ...published,
      place: null,
      distanceMeters: 0,
    } as Reel;

    expect(getReelContext(reel).authorTarget).toEqual({ type: "perfil", id: LUCAS });
  });
});
