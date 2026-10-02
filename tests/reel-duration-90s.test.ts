import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  __forgetSessionForTests,
  __resetLocalMediaForTests,
  __setOpfsDirectoryForTests,
  getLocalMediaRecord,
  saveLocalMedia,
} from "../src/lib/media/local-media-storage";
import { persistReelDraftClip, restoreReelDraftFile } from "../src/lib/reels/reel-draft";
import { REEL_MAX_DURATION_SECONDS } from "../src/lib/reels/reel-limits";
import { resolveMediaDurationSeconds } from "../src/lib/media/media-duration";

const projectRoot = join(import.meta.dir, "..");

function createMemoryOpfs() {
  const files = new Map<string, Blob>();
  function directory(prefix: string) {
    return {
      async getDirectoryHandle(name: string) {
        return directory(`${prefix}${name}/`);
      },
      async getFileHandle(name: string, options?: { create?: boolean }) {
        const path = `${prefix}${name}`;
        if (!files.has(path) && !options?.create) {
          throw new DOMException("missing", "NotFoundError");
        }
        return {
          async createWritable() {
            return {
              async write(data: Blob) {
                files.set(path, data);
              },
              async close() {},
            };
          },
          async getFile() {
            const blob = files.get(path);
            if (!blob) throw new DOMException("missing", "NotFoundError");
            return new File([blob], name, { type: blob.type });
          },
        };
      },
      async removeEntry(name: string) {
        files.delete(`${prefix}${name}`);
      },
    };
  }
  return { root: directory(""), files };
}

function createMemoryStorage() {
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
  } as Storage;
}

describe("Bug dos 90 segundos — gravação curta persiste a duração real", () => {
  afterEach(() => {
    __resetLocalMediaForTests();
  });

  test("gravação curta → OPFS → mediaId → reload mantém 5s e não vira 90s", async () => {
    const opfs = createMemoryOpfs();
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: storage,
    });
    __setOpfsDirectoryForTests(opfs.root);

    const blob = new Blob(["short-reel"], { type: "video/webm" });
    const draft = await persistReelDraftClip({
      blob,
      mimeType: "video/webm",
      fileName: "short.webm",
      recordedSec: 5,
      metadataSec: REEL_MAX_DURATION_SECONDS,
      maxSeconds: REEL_MAX_DURATION_SECONDS,
    });

    expect(draft.durationSec).toBe(5);
    expect(draft.mediaId).toBeTruthy();

    const saved = await getLocalMediaRecord(draft.mediaId);
    expect(saved?.durationMs).toBe(5000);

    __forgetSessionForTests();
    __setOpfsDirectoryForTests(opfs.root);

    const restored = await restoreReelDraftFile();
    expect(restored?.draft.mediaId).toBe(draft.mediaId);
    expect(restored?.draft.durationSec).toBe(5);
    expect(
      resolveMediaDurationSeconds({
        recordedSec: restored?.draft.durationSec,
        metadataSec: REEL_MAX_DURATION_SECONDS,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).toBe(5);
  });

  test("saveLocalMedia guarda durationMs e sobrevive ao reload", async () => {
    const opfs = createMemoryOpfs();
    __setOpfsDirectoryForTests(opfs.root);
    const record = await saveLocalMedia({
      kind: "reel",
      scope: "reel",
      blob: new Blob(["clip"], { type: "video/webm" }),
      mimeType: "video/webm",
      durationMs: 10_000,
    });
    __forgetSessionForTests();
    __setOpfsDirectoryForTests(opfs.root);
    expect((await getLocalMediaRecord(record.id))?.durationMs).toBe(10_000);
  });
});

describe("Tela Criar e Reel", () => {
  test("cards principais apontam para os fluxos existentes e têm arte local", async () => {
    const hub = await readFile(join(projectRoot, "src/routes/_app/create.tsx"), "utf8");
    expect(hub).toContain("Criar Foto");
    expect(hub).toContain("Criar Evento");
    expect(hub).toContain("Criar Local");
    expect(hub).toContain("Criar Negócio");
    expect(hub).toContain("Abrir Marketplace");
    expect(hub).toContain("Criar Reel");
    expect(hub).toContain("Carona Amiga");
    expect(hub).toContain('route: "/carona/nova"');
    const businessAt = hub.indexOf('id: "business"');
    const caronaAt = hub.indexOf('id: "carona"');
    const reelAt = hub.indexOf('id: "reel"');
    expect(businessAt).toBeGreaterThan(-1);
    expect(caronaAt).toBeGreaterThan(businessAt);
    expect(reelAt).toBeGreaterThan(caronaAt);
    expect(hub.slice(businessAt, caronaAt)).not.toContain('id: "hail"');
    expect(hub).toContain("CANONICAL_RIDE_CREATE_ROUTE");
    expect(hub).not.toContain("Passageiro");
    expect(hub).not.toContain("Motorista");
    expect(hub).not.toContain("Criar Marketplace");
    expect(hub).not.toContain("Meu Perfil");
    expect(hub).not.toContain("Criar Momento");
    expect(hub).toContain("CANONICAL_POST_PUBLISH_ROUTE");
    expect(hub).toContain("CANONICAL_REEL_PUBLISH_ROUTE");
    expect(hub).toContain('route: "/create/event"');
    expect(hub).toContain('route: "/create/place"');
    expect(hub).toContain('route: "/create/place-business"');
    expect(hub).not.toContain('route: "/create/offer"');
    expect(hub).not.toContain("https://");
    expect(hub).toContain("CreateCardArt");
    const marketplace = await readFile(join(projectRoot, "src/routes/_app/marketplace.tsx"), "utf8");
    expect(marketplace).toContain('to="/create/offer"');
    expect(marketplace).toContain("Vender algo");
  });
});
