import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CanonicalMediaObject, MediaRef } from "../src/lib/media/media-contract";
import {
  createMediaResolver,
  MediaResolverScopeError,
  redactMediaUrlForLog,
  requireAuthorizationScope,
  type MediaCache,
  type MediaSignResult,
} from "../src/lib/media/media-resolver";

const projectRoot = join(import.meta.dir, "..");
const UUID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

function object(path = `${UUID}/a.jpg`): CanonicalMediaObject {
  return { bucket: "bio-media", path, kind: "image" };
}

function valid(path?: string): MediaRef {
  return { state: "valid", object: object(path) };
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("G1 D-M4 resolve valid media", () => {
  test("signs once, returns ready and caches until expiry (with skew)", async () => {
    let now = 1_000_000;
    let calls = 0;
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      now: () => now,
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: "https://signed/x?token=SECRET", expiresIn: 300 };
      },
    });

    const first = await resolver.resolve(valid());
    expect(first.status).toBe("ready");

    now += 60_000;
    const second = await resolver.resolve(valid());
    expect(second.status).toBe("ready");
    expect(calls).toBe(1);

    now += 300_000;
    await resolver.resolve(valid());
    expect(calls).toBe(2);
  });

  test("maps forbidden/missing/unavailable and thrown sign", async () => {
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (o): Promise<MediaSignResult> => {
        if (o.path.endsWith("forbidden.jpg")) return { status: "forbidden" };
        if (o.path.endsWith("missing.jpg")) return { status: "missing" };
        if (o.path.endsWith("boom.jpg")) throw new Error("no network");
        return { status: "unavailable" };
      },
    });
    expect((await resolver.resolve(valid(`${UUID}/forbidden.jpg`))).status).toBe("forbidden");
    expect((await resolver.resolve(valid(`${UUID}/missing.jpg`))).status).toBe("missing");
    expect((await resolver.resolve(valid(`${UUID}/boom.jpg`))).status).toBe("unavailable");
    expect((await resolver.resolve(valid(`${UUID}/other.jpg`))).status).toBe("unavailable");
  });
});

describe("G1 D-M4 legacy, local and invalid states", () => {
  test("legacy urls pass through without signing", async () => {
    let calls = 0;
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: "x", expiresIn: 300 };
      },
    });
    const result = await resolver.resolve({
      state: "legacy-public",
      url: "https://proj.supabase.co/storage/v1/object/public/bio-media/a.jpg",
      kind: "image",
    });
    expect(result).toEqual({
      status: "legacy",
      url: "https://proj.supabase.co/storage/v1/object/public/bio-media/a.jpg",
    });
    expect(calls).toBe(0);
  });

  test("local media uses getLocalUrl when available", async () => {
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => ({ status: "unavailable" }),
      getLocalUrl: (id) => (id === "known" ? "blob:local-url" : null),
    });
    expect(await resolver.resolve({ state: "local", mediaId: "known", kind: "image" })).toEqual({
      status: "local",
      mediaId: "known",
      url: "blob:local-url",
    });
    expect(await resolver.resolve({ state: "local", mediaId: "unknown", kind: "image" })).toEqual({
      status: "local",
      mediaId: "unknown",
    });
  });

  test("invalid refs never receive privileged access", async () => {
    let calls = 0;
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: "x", expiresIn: 300 };
      },
    });
    expect((await resolver.resolve({ state: "invalid", reason: "no-identity" })).status).toBe(
      "forbidden",
    );
    expect(calls).toBe(0);
  });
});

describe("G1.4 R1 explicit authorization scope", () => {
  const sign = async (): Promise<MediaSignResult> => ({ status: "unavailable" });

  test("rejects absent, empty, whitespace, control and non-string scopes", () => {
    expect(() =>
      createMediaResolver({ authorizationScope: undefined as unknown as string, sign }),
    ).toThrow(MediaResolverScopeError);
    expect(() => createMediaResolver({ authorizationScope: "", sign })).toThrow(
      MediaResolverScopeError,
    );
    expect(() => createMediaResolver({ authorizationScope: "   ", sign })).toThrow(
      MediaResolverScopeError,
    );
    expect(() => createMediaResolver({ authorizationScope: "a\u0000b", sign })).toThrow(
      MediaResolverScopeError,
    );
    expect(() =>
      createMediaResolver({ authorizationScope: 42 as unknown as string, sign }),
    ).toThrow(MediaResolverScopeError);
    expect(requireAuthorizationScope("viewer-a")).toBe("viewer-a");
    expect(requireAuthorizationScope("  viewer-a  ")).toBe("viewer-a");
  });

  test("keeps two viewers isolated in a shared cache", async () => {
    let calls = 0;
    const cache: MediaCache = new Map();
    const makeSigner = () => async (): Promise<MediaSignResult> => {
      calls += 1;
      return { status: "ready", url: `url:${calls}`, expiresIn: 300 };
    };
    const a = createMediaResolver({ authorizationScope: "viewer-a", cache, sign: makeSigner() });
    const b = createMediaResolver({ authorizationScope: "viewer-b", cache, sign: makeSigner() });

    const [ra, rb] = await Promise.all([a.resolve(valid()), b.resolve(valid())]);
    expect(ra.status).toBe("ready");
    expect(rb.status).toBe("ready");
    expect(calls).toBe(2);
    if (ra.status === "ready" && rb.status === "ready") expect(ra.url).not.toBe(rb.url);
  });
});

describe("G1.4 R3/R4/R5 invalidation and in-flight safety", () => {
  test("clearing the cache during an in-flight resolution prevents repopulation", async () => {
    let calls = 0;
    const gate = deferred();
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        await gate.promise;
        return { status: "ready", url: `u:${calls}`, expiresIn: 300 };
      },
    });

    const pending = resolver.resolve(valid());
    resolver.invalidateAll();
    gate.resolve();
    const result = await pending;
    expect(result.status).toBe("ready");

    // resultado antigo NAO repovoa: uma nova resolucao volta a assinar
    await resolver.resolve(valid());
    expect(calls).toBe(2);
  });

  test("a resolution started before a scope change is not reused by the new scope", async () => {
    let calls = 0;
    const gate = deferred();
    const cache: MediaCache = new Map();
    const makeSigner = () => async (): Promise<MediaSignResult> => {
      calls += 1;
      const id = calls;
      await gate.promise;
      return { status: "ready", url: `u:${id}`, expiresIn: 300 };
    };

    const a = createMediaResolver({ authorizationScope: "viewer-a", cache, sign: makeSigner() });
    const pendingA = a.resolve(valid());

    // escopo troca antes de A terminar
    const b = createMediaResolver({ authorizationScope: "viewer-b", cache, sign: makeSigner() });
    const pendingB = b.resolve(valid());
    gate.resolve();
    const [ra, rb] = await Promise.all([pendingA, pendingB]);
    expect(calls).toBe(2);
    expect(ra.status).toBe("ready");
    expect(rb.status).toBe("ready");
    if (ra.status === "ready" && rb.status === "ready") expect(ra.url).not.toBe(rb.url);
  });

  test("simultaneous resolutions in two scopes share no in-flight result", async () => {
    let calls = 0;
    const cache: MediaCache = new Map();
    const makeSigner = () => async (): Promise<MediaSignResult> => {
      calls += 1;
      return { status: "ready", url: `url:${calls}`, expiresIn: 300 };
    };
    const a = createMediaResolver({ authorizationScope: "viewer-a", cache, sign: makeSigner() });
    const b = createMediaResolver({ authorizationScope: "viewer-b", cache, sign: makeSigner() });

    const results = await Promise.all([a.resolve(valid()), b.resolve(valid())]);
    expect(calls).toBe(2);
    expect(results[0]?.status).toBe("ready");
    expect(results[1]?.status).toBe("ready");
  });

  test("invalidateMedia clears only the targeted media (positive and negative)", async () => {
    let total = 0;
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (o): Promise<MediaSignResult> => {
        total += 1;
        return o.path.endsWith("a.jpg")
          ? { status: "ready", url: `u:${total}`, expiresIn: 300 }
          : { status: "forbidden" };
      },
    });

    await resolver.resolve(valid(`${UUID}/a.jpg`)); // ready + cached
    await resolver.resolve(valid(`${UUID}/c.jpg`)); // forbidden + cached
    expect(total).toBe(2);

    resolver.invalidateMedia("bio-media", `${UUID}/a.jpg`);
    await resolver.resolve(valid(`${UUID}/a.jpg`)); // re-assina (positivo invalidado)
    expect(total).toBe(3);
    await resolver.resolve(valid(`${UUID}/c.jpg`)); // ainda em cache negativo
    expect(total).toBe(3);

    resolver.invalidateAll();
    await resolver.resolve(valid(`${UUID}/c.jpg`)); // negativo invalidado: re-consulta
    expect(total).toBe(4);
  });

  test("invalidateScope clears one viewer without touching the other", async () => {
    let callsA = 0;
    let callsB = 0;
    const cache: MediaCache = new Map();
    const a = createMediaResolver({
      authorizationScope: "viewer-a",
      cache,
      sign: async (): Promise<MediaSignResult> => ({
        status: "ready",
        url: `a:${++callsA}`,
        expiresIn: 300,
      }),
    });
    const b = createMediaResolver({
      authorizationScope: "viewer-b",
      cache,
      sign: async (): Promise<MediaSignResult> => ({
        status: "ready",
        url: `b:${++callsB}`,
        expiresIn: 300,
      }),
    });

    await a.resolve(valid());
    await b.resolve(valid());
    expect([callsA, callsB]).toEqual([1, 1]);

    a.invalidateScope("viewer-b");
    await b.resolve(valid());
    await a.resolve(valid());
    expect([callsA, callsB]).toEqual([1, 2]);
  });

  test("caches negative results with a short TTL, never as permanent", async () => {
    let now = 0;
    let calls = 0;
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      now: () => now,
      negativeTtlSeconds: 5,
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "forbidden" };
      },
    });
    expect((await resolver.resolve(valid())).status).toBe("forbidden");
    expect((await resolver.resolve(valid())).status).toBe("forbidden");
    expect(calls).toBe(1);

    now += 5_001;
    await resolver.resolve(valid());
    expect(calls).toBe(2);
  });
});

describe("G1 D-M4 cache capacity, dedup, resolveMany and log redaction", () => {
  test("deduplicates simultaneous calls for the same identity", async () => {
    let calls = 0;
    const gate = deferred();
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        await gate.promise;
        return { status: "ready", url: "u", expiresIn: 300 };
      },
    });

    const first = resolver.resolve(valid());
    const second = resolver.resolve(valid());
    gate.resolve();
    const results = await Promise.all([first, second]);
    expect(results.every((r) => r.status === "ready")).toBe(true);
    expect(calls).toBe(1);
  });

  test("evicts the oldest entry deterministically when over capacity", async () => {
    let calls = 0;
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      maxCacheEntries: 2,
      sign: async (o): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: `url:${o.path}`, expiresIn: 300 };
      },
    });
    await resolver.resolve(valid(`${UUID}/1.jpg`));
    await resolver.resolve(valid(`${UUID}/2.jpg`));
    await resolver.resolve(valid(`${UUID}/3.jpg`));
    expect(calls).toBe(3);

    await resolver.resolve(valid(`${UUID}/1.jpg`));
    expect(calls).toBe(4);
    await resolver.resolve(valid(`${UUID}/3.jpg`));
    expect(calls).toBe(4);
  });

  test("resolves many in order", async () => {
    const resolver = createMediaResolver({
      authorizationScope: "viewer-a",
      sign: async (o): Promise<MediaSignResult> => ({
        status: "ready",
        url: `url:${o.path}`,
        expiresIn: 300,
      }),
    });
    const results = await resolver.resolveMany([
      valid(`${UUID}/1.jpg`),
      { state: "local", mediaId: "m", kind: "image" },
    ]);
    expect(results[0]).toEqual({
      status: "ready",
      url: `url:${UUID}/1.jpg`,
      expiresAt: expect.any(Number),
    });
    expect(results[1]).toEqual({ status: "local", mediaId: "m" });
  });

  test("redacts tokens for logging", () => {
    expect(redactMediaUrlForLog("https://x/object/sign/b/p.jpg?token=SECRET")).toBe(
      "https://x/object/sign/b/p.jpg?[REDACTED]",
    );
    expect(redactMediaUrlForLog("https://x/object/public/b/p.jpg")).toBe(
      "https://x/object/public/b/p.jpg",
    );
  });

  test("resolver module never logs", async () => {
    const text = await readFile(join(projectRoot, "src/lib/media/media-resolver.ts"), "utf8");
    expect(text.includes("console.")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
  });
});
