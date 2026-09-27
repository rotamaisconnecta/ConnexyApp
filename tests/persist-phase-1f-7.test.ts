import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  acceptRequest,
  getPendingRequests,
  isConnected,
  isFollowing,
  listFollowees,
  sendRequest,
  toggleFollow,
} from "../src/lib/demo/demo-db";
import {
  isDetailSaved,
  listSavedDetailIds,
  SAVED_DETAILS_STORAGE_KEY,
  toggleSavedDetail,
} from "../src/lib/marketplace/saved-details";
import { applyReelSocialState, getReelConnectStatus } from "../src/lib/reels/reel-social-state";
import { MOCK_REELS } from "../src/lib/reels/reel-mocks";
import { listLocalInboxItems } from "../src/lib/notifications/local-invite-inbox";

const A = "lucas";
const B = "beatriz";
const C = "rafael";
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

function reelByAuthor(authorId: string) {
  const reel = MOCK_REELS.find((item) => item.author.id === authorId);
  if (!reel) throw new Error(`reel de ${authorId} ausente`);
  return reel;
}

beforeEach(() => {
  installBrowser();
});

describe("Fase 1F-7 — Seguir reutiliza connexy:demo:db", () => {
  test("seguir e deixar de seguir persistem no blob social existente", () => {
    const reel = reelByAuthor(B);
    expect(isFollowing(B, A)).toBe(false);
    expect(applyReelSocialState(reel, A).author.isFollowing).toBe(false);
    expect(toggleFollow(B, A)).toBe(true);
    expect(toggleFollow(B, A)).toBe(false);
    expect(toggleFollow(B, A)).toBe(true);
    expect(isFollowing(B, A)).toBe(true);
    expect(listFollowees(A)).toEqual([B]);
    expect(toggleFollow(A, A)).toBe(false);
    expect(isFollowing(A, A)).toBe(false);

    reloadContext();
    expect(isFollowing(B, A)).toBe(true);
    expect(applyReelSocialState(reel, A).author.isFollowing).toBe(true);
    expect(toggleFollow(B, A)).toBe(false);
    reloadContext();
    expect(isFollowing(B, A)).toBe(false);
  });
});

describe("Fase 1F-7 — Guardar reutiliza connexy:demo:saved-details", () => {
  test("guardar o Reel usa a mesma lista de locais e sobrevive ao reload", () => {
    const reel = reelByAuthor(B);
    expect(toggleSavedDetail("cafe-central")).toBe(true);
    expect(isDetailSaved(reel.id)).toBe(false);
    expect(applyReelSocialState(reel, A).savedByMe).toBe(false);
    expect(toggleSavedDetail(reel.id)).toBe(true);
    expect(toggleSavedDetail(reel.id)).toBe(false);
    expect(toggleSavedDetail(reel.id)).toBe(true);
    expect(listSavedDetailIds().sort()).toEqual(["cafe-central", reel.id].sort());
    expect(applyReelSocialState(reel, A).savedByMe).toBe(true);

    reloadContext();
    expect(isDetailSaved("cafe-central")).toBe(true);
    expect(isDetailSaved(reel.id)).toBe(true);
    expect(window.localStorage.getItem(SAVED_DETAILS_STORAGE_KEY)).toContain(reel.id);
    expect(window.localStorage.getItem("connexy:demo:saved-reels")).toBeNull();
  });
});

describe("Fase 1F-7 — Conectar reutiliza 1D-2", () => {
  test("o autor do Reel entra no fluxo de solicitação existente", async () => {
    const reel = reelByAuthor(B);
    expect(getReelConnectStatus(reel.author.id, A)).toBe("available");
    const request = sendRequest(A, B, "Vi seu reel");
    expect(getReelConnectStatus(B, A)).toBe("pending");
    expect(getPendingRequests(B)[0]?.id).toBe(request.id);
    expect(listLocalInboxItems(B)[0]).toMatchObject({
      kind: "conversation_invite",
      fromUserId: A,
    });
    await acceptRequest(A, B);
    expect(isConnected(B, A)).toBe(true);
    expect(getReelConnectStatus(B, A)).toBe("connected");
    expect(getReelConnectStatus(B, A)).toBe(getReelConnectStatus(reel.author.id, A));
    expect(getReelConnectStatus(A, A)).toBe("unavailable");
    expect(getReelConnectStatus("b2", A)).toBe("unavailable");
    expect(getReelConnectStatus(C, A)).toBe("available");
  });
});

describe("Fase 1F-7 — superfícies e regressão", () => {
  test("feed e detalhe deixam de usar só estado React e não criam stores paralelos", async () => {
    const feed = await source("src/routes/_app.reels.tsx");
    expect(feed).toContain("toggleFollow");
    expect(feed).toContain("toggleSavedDetail");
    expect(feed).toContain("/solicitacao/$id");
    expect(feed).not.toContain("onConnect={() => {}}");
    expect(feed).not.toContain("supabase.from(");

    const detail = await source("src/routes/_app/reels/$reelId.tsx");
    expect(detail).toContain("toggleFollow");
    expect(detail).toContain("toggleSavedDetail");
    expect(detail).toContain("/solicitacao/$id");

    const store = await source("src/lib/demo/demo-db.ts");
    expect(store).toContain("follows");
    expect(store).toContain("toggleFollow");
    expect(store).not.toContain("FollowRepository");

    const schema = await source("src/lib/persistence/domain/reels-schema.ts");
    expect(schema).not.toContain("reel_follows");
    expect(schema).not.toContain("reel_saves");
  });
});
