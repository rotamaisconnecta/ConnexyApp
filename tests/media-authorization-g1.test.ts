import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  authorizeMediaAccess,
  canViewPost,
  clampMediaUrlTtl,
  createMediaUrlService,
  MEDIA_URL_TTL_DEFAULT_SECONDS,
  MEDIA_URL_TTL_MAX_SECONDS,
  MEDIA_URL_TTL_MIN_SECONDS,
  type AuthorizablePost,
  type MediaLocator,
} from "../src/lib/media/media-authorization";

const projectRoot = join(import.meta.dir, "..");
const VIEWER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const AUTHOR = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

function post(overrides: Partial<AuthorizablePost> = {}): AuthorizablePost {
  return {
    id: "p1",
    author_id: AUTHOR,
    privacy: "PUBLIC",
    media: [{ type: "image", bucket: "bio-media", path: `${AUTHOR}/a.jpg` }],
    ...overrides,
  };
}

const identity = (bucket = "bio-media", path = `${AUTHOR}/a.jpg`): MediaLocator => ({
  kind: "identity",
  bucket,
  path,
});

describe("G1 D-M3 canViewPost mirrors posts_select_privacy", () => {
  test("PUBLIC visible to any authenticated viewer", () => {
    expect(
      canViewPost({ privacy: "PUBLIC", authorId: AUTHOR, viewerId: VIEWER, areConnected: false }),
    ).toBe(true);
    expect(
      canViewPost({ privacy: "PUBLIC", authorId: AUTHOR, viewerId: null, areConnected: false }),
    ).toBe(false);
  });

  test("author always sees own post; anonymous never", () => {
    for (const privacy of ["PUBLIC", "CONNECTIONS", "PRIVATE"]) {
      expect(
        canViewPost({ privacy, authorId: AUTHOR, viewerId: AUTHOR, areConnected: false }),
      ).toBe(true);
      expect(canViewPost({ privacy, authorId: AUTHOR, viewerId: null, areConnected: true })).toBe(
        false,
      );
    }
  });

  test("CONNECTIONS depends on are_connected; PRIVATE stays author-only", () => {
    expect(
      canViewPost({
        privacy: "CONNECTIONS",
        authorId: AUTHOR,
        viewerId: VIEWER,
        areConnected: true,
      }),
    ).toBe(true);
    expect(
      canViewPost({
        privacy: "CONNECTIONS",
        authorId: AUTHOR,
        viewerId: VIEWER,
        areConnected: false,
      }),
    ).toBe(false);
    expect(
      canViewPost({ privacy: "PRIVATE", authorId: AUTHOR, viewerId: VIEWER, areConnected: true }),
    ).toBe(false);
  });
});

describe("G1 D-M3 authorizeMediaAccess", () => {
  test("allows canonical owner path by stable identity", () => {
    const decision = authorizeMediaAccess({
      post: post(),
      locator: identity(),
      viewerId: VIEWER,
      areConnected: false,
    });
    expect(decision.allowed).toBe(true);
  });

  test("allows by index over the same server normalization", () => {
    const decision = authorizeMediaAccess({
      post: post(),
      locator: { kind: "index", index: 0 },
      viewerId: VIEWER,
      areConnected: false,
    });
    expect(decision.allowed).toBe(true);
  });

  test("unregistered identity is missing-media, not a trusted path", () => {
    const decision = authorizeMediaAccess({
      post: post(),
      locator: identity("bio-media", `${AUTHOR}/other.jpg`),
      viewerId: VIEWER,
      areConnected: false,
    });
    expect(decision).toEqual({ allowed: false, reason: "missing-media" });
  });

  test("rejects registered-but-foreign owner path", () => {
    const decision = authorizeMediaAccess({
      post: post({ media: [{ type: "image", bucket: "bio-media", path: `${VIEWER}/stolen.jpg` }] }),
      locator: identity("bio-media", `${VIEWER}/stolen.jpg`),
      viewerId: VIEWER,
      areConnected: false,
    });
    expect(decision).toEqual({ allowed: false, reason: "invalid-ref" });
  });

  test("L4: rejects bucket incompatible with the media kind", () => {
    const decision = authorizeMediaAccess({
      post: post({ media: [{ type: "video", bucket: "avatars", path: `${AUTHOR}/v.mp4` }] }),
      locator: identity("avatars", `${AUTHOR}/v.mp4`),
      viewerId: VIEWER,
      areConnected: false,
    });
    expect(decision).toEqual({ allowed: false, reason: "invalid-ref" });
  });

  test("rejects not-found, forbidden, bad locator and non-canonical refs", () => {
    expect(
      authorizeMediaAccess({
        post: null,
        locator: identity(),
        viewerId: VIEWER,
        areConnected: false,
      }),
    ).toEqual({
      allowed: false,
      reason: "not-found",
    });
    expect(
      authorizeMediaAccess({
        post: post({ privacy: "PRIVATE" }),
        locator: identity(),
        viewerId: VIEWER,
        areConnected: true,
      }),
    ).toEqual({ allowed: false, reason: "forbidden" });
    expect(
      authorizeMediaAccess({
        post: post(),
        locator: { kind: "index", index: -1 },
        viewerId: VIEWER,
        areConnected: false,
      }),
    ).toEqual({ allowed: false, reason: "invalid-ref" });
    expect(
      authorizeMediaAccess({
        post: post(),
        locator: { kind: "index", index: 9 },
        viewerId: VIEWER,
        areConnected: false,
      }),
    ).toEqual({ allowed: false, reason: "missing-media" });
    expect(
      authorizeMediaAccess({
        post: post({ media: [{ type: "image", preview: "https://evil.example/x.jpg" }] }),
        locator: { kind: "index", index: 0 },
        viewerId: VIEWER,
        areConnected: false,
      }),
    ).toEqual({ allowed: false, reason: "invalid-ref" });
  });
});

describe("G1 D-M3 createMediaUrlService (server core, sign injected)", () => {
  function service(overrides: Partial<Parameters<typeof createMediaUrlService>[0]> = {}) {
    return createMediaUrlService({
      isEnabled: () => true,
      getViewerId: async () => VIEWER,
      loadPost: async () => post(),
      areConnected: async () => false,
      sign: async () => ({ status: "ready", url: "https://signed/x?token=SECRET", expiresIn: 300 }),
      now: () => 0,
      ...overrides,
    });
  }

  test("disabled flag returns unavailable without touching dependencies", async () => {
    let called = false;
    const svc = service({
      isEnabled: () => false,
      loadPost: async () => {
        called = true;
        return post();
      },
    });
    expect(await svc.getMediaUrl("p1", identity())).toEqual({ status: "unavailable" });
    expect(called).toBe(false);
  });

  test("anonymous viewer is forbidden", async () => {
    expect(await service({ getViewerId: async () => null }).getMediaUrl("p1", identity())).toEqual({
      status: "forbidden",
    });
  });

  test("nonexistent post is forbidden (no existence oracle)", async () => {
    expect(
      await service({ loadPost: async () => null }).getMediaUrl("missing", identity()),
    ).toEqual({
      status: "forbidden",
    });
  });

  test("PUBLIC viewer gets a ready url from the injected signer", async () => {
    const result = await service().getMediaUrl("p1", identity());
    expect(result).toEqual({
      status: "ready",
      url: "https://signed/x?token=SECRET",
      expiresAt: 300_000,
    });
  });

  test("CONNECTIONS only signs when are_connected is true", async () => {
    let called = 0;
    const connected = await service({
      loadPost: async () => post({ privacy: "CONNECTIONS" }),
      areConnected: async () => true,
      sign: async () => {
        called += 1;
        return { status: "ready", url: "u", expiresIn: 60 };
      },
    }).getMediaUrl("p1", identity());
    expect(connected.status).toBe("ready");
    expect(called).toBe(1);

    const denied = await service({
      loadPost: async () => post({ privacy: "CONNECTIONS" }),
      areConnected: async () => false,
    }).getMediaUrl("p1", identity());
    expect(denied).toEqual({ status: "forbidden" });
  });

  test("missing media maps to missing; signer forbidden maps to forbidden; errors to unavailable", async () => {
    expect(await service().getMediaUrl("p1", identity("bio-media", `${AUTHOR}/none.jpg`))).toEqual({
      status: "missing",
    });
    expect(
      await service({ sign: async () => ({ status: "forbidden" }) }).getMediaUrl("p1", identity()),
    ).toEqual({
      status: "forbidden",
    });
    expect(
      await service({
        loadPost: async () => {
          throw new Error("db down");
        },
      }).getMediaUrl("p1", identity()),
    ).toEqual({ status: "unavailable" });
  });
});

describe("G1 M3 TTL enforcement inside the service", () => {
  test("clamp handles absent, non-numeric and out-of-range values", () => {
    expect(MEDIA_URL_TTL_DEFAULT_SECONDS).toBe(300);
    expect(clampMediaUrlTtl(undefined)).toBe(MEDIA_URL_TTL_DEFAULT_SECONDS);
    expect(clampMediaUrlTtl(null)).toBe(MEDIA_URL_TTL_DEFAULT_SECONDS);
    expect(clampMediaUrlTtl(Number.NaN)).toBe(MEDIA_URL_TTL_DEFAULT_SECONDS);
    expect(clampMediaUrlTtl(Number.POSITIVE_INFINITY)).toBe(MEDIA_URL_TTL_DEFAULT_SECONDS);
    expect(clampMediaUrlTtl(10)).toBe(MEDIA_URL_TTL_MIN_SECONDS);
    expect(clampMediaUrlTtl(120)).toBe(120);
    expect(clampMediaUrlTtl(9999)).toBe(MEDIA_URL_TTL_MAX_SECONDS);
  });

  test("passes the clamped TTL as the real argument to sign", async () => {
    const seen: number[] = [];
    const svc = (ttlSeconds?: number) =>
      createMediaUrlService({
        isEnabled: () => true,
        getViewerId: async () => VIEWER,
        loadPost: async () => post(),
        areConnected: async () => false,
        ttlSeconds,
        now: () => 0,
        sign: async (_object, ttl) => {
          seen.push(ttl);
          return { status: "ready", url: "u", expiresIn: ttl };
        },
      });

    await svc(10).getMediaUrl("p1", identity());
    await svc(120).getMediaUrl("p1", identity());
    await svc(9999).getMediaUrl("p1", identity());
    await svc(undefined).getMediaUrl("p1", identity());
    expect(seen).toEqual([60, 120, 300, 300]);
  });

  test("does not report validity beyond the service TTL", async () => {
    const result = await createMediaUrlService({
      isEnabled: () => true,
      getViewerId: async () => VIEWER,
      loadPost: async () => post(),
      areConnected: async () => false,
      ttlSeconds: 300,
      now: () => 0,
      sign: async () => ({ status: "ready", url: "u", expiresIn: 9999 }),
    }).getMediaUrl("p1", identity());
    expect(result).toEqual({ status: "ready", url: "u", expiresAt: 300_000 });
  });
});

describe("G1 module purity", () => {
  test("authorization module never logs or embeds privileged credentials", async () => {
    const text = await readFile(join(projectRoot, "src/lib/media/media-authorization.ts"), "utf8");
    expect(text.includes("console.")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
    expect(text.includes("createClient")).toBe(false);
    expect(text.includes("@/lib/supabase/client")).toBe(false);
  });
});
