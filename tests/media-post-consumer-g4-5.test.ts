import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  classifyPostMediaItem,
  createPostMediaResolver,
  isCanonicalPostMedia,
  isEligiblePostId,
  listPostMediaRefs,
  mediaUrlResultToSignResult,
  POST_MEDIA_MAX_TTL_SECONDS,
  resolvePostMedia,
  shouldUseSecurePostMedia,
  type PostMediaLike,
  type SecurePostMediaPolicy,
} from "../src/lib/media/post-media-resolver";
import type { MediaSignResult, MediaResolution } from "../src/lib/media/media-resolver";
import { findLiteral, scanSourceFiles } from "./helpers/source-scan";

const projectRoot = join(import.meta.dir, "..");
const UUID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER_UUID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const SIGNING_ON: SecurePostMediaPolicy = { isSigningEnabled: () => true };
const SIGNING_OFF: SecurePostMediaPolicy = { isSigningEnabled: () => false };

function canonicalMedia(overrides: Partial<PostMediaLike> = {}): PostMediaLike {
  return { type: "image", bucket: "bio-media", path: `${UUID}/photo.jpg`, ...overrides };
}

const EXTERNAL_PREVIEW: PostMediaLike = { type: "image", preview: "https://cdn.example.com/x.jpg" };
const LOCAL_MEDIA: PostMediaLike = {
  type: "image",
  mediaId: "local-1",
  preview: "data:image/png;base64,AAAA",
};

describe("G4.5 eligibility and canonical classification", () => {
  test("only a valid (bucket,path) item is canonical", () => {
    expect(isCanonicalPostMedia(canonicalMedia())).toBe(true);
    expect(isCanonicalPostMedia(canonicalMedia({ type: "video" }))).toBe(true);
  });

  test("preview-only external URLs and local media are NOT canonical", () => {
    expect(isCanonicalPostMedia(EXTERNAL_PREVIEW)).toBe(false);
    expect(isCanonicalPostMedia(LOCAL_MEDIA)).toBe(false);
    expect(listPostMediaRefs([EXTERNAL_PREVIEW])[0].state).toBe("invalid");
    expect(listPostMediaRefs([LOCAL_MEDIA])[0].state).toBe("local");
  });

  test("an empty media list resolves to no refs (post without attachments)", () => {
    expect(listPostMediaRefs([])).toEqual([]);
  });

  test("post ids must be UUIDs; demo/local ids are rejected", () => {
    expect(isEligiblePostId(UUID)).toBe(true);
    expect(isEligiblePostId("demo-post-123")).toBe(false);
    expect(isEligiblePostId("")).toBe(false);
    expect(isEligiblePostId(undefined)).toBe(false);
  });
});

describe("G4.5 forward gate (shouldUseSecurePostMedia)", () => {
  test("forwards only when flag on + uuid post + canonical media + viewer", () => {
    expect(
      shouldUseSecurePostMedia({
        postId: UUID,
        viewerId: "viewer-a",
        media: canonicalMedia(),
        policy: SIGNING_ON,
      }),
    ).toBe(true);
  });

  test("flag OFF keeps the legacy path (no forward)", () => {
    expect(
      shouldUseSecurePostMedia({
        postId: UUID,
        viewerId: "viewer-a",
        media: canonicalMedia(),
        policy: SIGNING_OFF,
      }),
    ).toBe(false);
  });

  test("missing viewer, non-uuid post or non-canonical media never forwards", () => {
    expect(
      shouldUseSecurePostMedia({
        postId: UUID,
        viewerId: null,
        media: canonicalMedia(),
        policy: SIGNING_ON,
      }),
    ).toBe(false);
    expect(
      shouldUseSecurePostMedia({
        postId: "demo-post-1",
        viewerId: "viewer-a",
        media: canonicalMedia(),
        policy: SIGNING_ON,
      }),
    ).toBe(false);
    expect(
      shouldUseSecurePostMedia({
        postId: UUID,
        viewerId: "viewer-a",
        media: EXTERNAL_PREVIEW,
        policy: SIGNING_ON,
      }),
    ).toBe(false);
  });
});

describe("G4.5 resolver forwards the post identity to sign", () => {
  test("binds postId and the canonical (bucket,path) locator", async () => {
    const calls: Array<{ postId: string; bucket: string; path: string }> = [];
    const resolver = createPostMediaResolver({
      postId: UUID,
      authorizationScope: "viewer-a",
      sign: async ({ postId, object }) => {
        calls.push({ postId, bucket: object.bucket, path: object.path });
        return { status: "ready", url: "https://storage/x?sig=1", expiresIn: 120 };
      },
    });

    const result = await resolvePostMedia(resolver, canonicalMedia());
    expect(result.status).toBe("ready");
    if (result.status === "ready") expect(result.url).toBe("https://storage/x?sig=1");
    expect(calls).toEqual([{ postId: UUID, bucket: "bio-media", path: `${UUID}/photo.jpg` }]);
  });

  test("flag OFF / non-eligible media never reaches sign", async () => {
    let calls = 0;
    const resolver = createPostMediaResolver({
      postId: UUID,
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: "https://storage/x?sig=1", expiresIn: 120 };
      },
    });

    // Caminho legado/local nao consulta o servidor.
    const local = await resolvePostMedia(resolver, LOCAL_MEDIA);
    expect(local.status).toBe("local");
    expect(calls).toBe(0);

    // A decisao de desviar (predicado) e o que impede a chamada quando a flag
    // esta OFF: sem forward, o resolver nem e invocado pelo consumidor.
    expect(
      shouldUseSecurePostMedia({
        postId: UUID,
        viewerId: "viewer-a",
        media: canonicalMedia(),
        policy: SIGNING_OFF,
      }),
    ).toBe(false);
    expect(calls).toBe(0);
  });
});

describe("G4.5 fail-closed authorization", () => {
  function resolverWith(result: MediaSignResult, scope = "viewer-a") {
    return createPostMediaResolver({
      postId: UUID,
      authorizationScope: scope,
      sign: async () => result,
    });
  }

  test("private media for another user returns forbidden with no URL fallback", async () => {
    const result = await resolvePostMedia(resolverWith({ status: "forbidden" }), canonicalMedia());
    expect(result).toEqual({ status: "forbidden" });
  });

  test("restricted (CONNECTIONS) denial also returns forbidden, never a public URL", async () => {
    const result = await resolvePostMedia(
      resolverWith({ status: "forbidden" }, "viewer-b"),
      canonicalMedia(),
    );
    expect(result).toEqual({ status: "forbidden" });
  });

  test("missing/unavailable and a thrown sign stay closed", async () => {
    expect(
      (await resolvePostMedia(resolverWith({ status: "missing" }), canonicalMedia())).status,
    ).toBe("missing");
    expect(
      (await resolvePostMedia(resolverWith({ status: "unavailable" }), canonicalMedia())).status,
    ).toBe("unavailable");

    const throwing = createPostMediaResolver({
      postId: UUID,
      authorizationScope: "viewer-a",
      sign: async () => {
        throw new Error("network");
      },
    });
    expect((await resolvePostMedia(throwing, canonicalMedia())).status).toBe("unavailable");
  });

  test("an adulterated path is rejected before sign (defense in depth)", async () => {
    let calls = 0;
    const resolver = createPostMediaResolver({
      postId: UUID,
      authorizationScope: "viewer-a",
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: "https://storage/x", expiresIn: 60 };
      },
    });
    const bad = canonicalMedia({ path: "https://evil.example.com/x.jpg" });
    const result = await resolvePostMedia(resolver, bad);
    expect(result.status).toBe("forbidden");
    expect(calls).toBe(0);
  });
});

describe("G4.5 cache scope isolation and expiry", () => {
  test("switching users re-signs in distinct scopes (no cross-user URL reuse)", async () => {
    const cache = new Map();
    const seen: string[] = [];
    const make = (scope: string) =>
      createPostMediaResolver({
        postId: UUID,
        authorizationScope: scope,
        cache,
        sign: async () => {
          seen.push(scope);
          return { status: "ready", url: `https://storage/${scope}`, expiresIn: 120 };
        },
      });

    const a: MediaResolution = await resolvePostMedia(make("viewer-a"), canonicalMedia());
    const b: MediaResolution = await resolvePostMedia(make("viewer-b"), canonicalMedia());

    expect(a.status === "ready" && a.url).toBe("https://storage/viewer-a");
    expect(b.status === "ready" && b.url).toBe("https://storage/viewer-b");
    expect(seen).toEqual(["viewer-a", "viewer-b"]);
  });

  test("an expired signed response is re-signed", async () => {
    let now = 1_000_000;
    let calls = 0;
    const cache = new Map();
    const resolver = createPostMediaResolver({
      postId: UUID,
      authorizationScope: "viewer-a",
      cache,
      now: () => now,
      sign: async (): Promise<MediaSignResult> => {
        calls += 1;
        return { status: "ready", url: `https://storage/${calls}`, expiresIn: 100 };
      },
    });

    await resolvePostMedia(resolver, canonicalMedia());
    now += 30_000;
    await resolvePostMedia(resolver, canonicalMedia());
    expect(calls).toBe(1);

    now += 120_000;
    await resolvePostMedia(resolver, canonicalMedia());
    expect(calls).toBe(2);
  });
});

describe("G4.5 server result mapping", () => {
  test("ready maps to expiresIn derived from expiresAt and clamped to 0..300", () => {
    const now = 1_000_000;
    const ok = mediaUrlResultToSignResult(
      { status: "ready", url: "https://s/x", expiresAt: now + 120_000 },
      now,
    );
    expect(ok).toEqual({ status: "ready", url: "https://s/x", expiresIn: 120 });

    const capped = mediaUrlResultToSignResult(
      { status: "ready", url: "https://s/x", expiresAt: now + 10_000_000 },
      now,
    );
    expect(capped.status === "ready" && capped.expiresIn).toBe(POST_MEDIA_MAX_TTL_SECONDS);

    const alreadyExpired = mediaUrlResultToSignResult(
      { status: "ready", url: "https://s/x", expiresAt: now - 5_000 },
      now,
    );
    expect(alreadyExpired.status === "ready" && alreadyExpired.expiresIn).toBe(0);
  });

  test("ready without expiresAt defaults to the max TTL", () => {
    const mapped = mediaUrlResultToSignResult({ status: "ready", url: "https://s/x" }, 0);
    expect(mapped).toEqual({
      status: "ready",
      url: "https://s/x",
      expiresIn: POST_MEDIA_MAX_TTL_SECONDS,
    });
  });

  test("non-ready states map to closed states and never carry a url", () => {
    expect(mediaUrlResultToSignResult({ status: "forbidden" })).toEqual({ status: "forbidden" });
    expect(mediaUrlResultToSignResult({ status: "missing" })).toEqual({ status: "missing" });
    expect(mediaUrlResultToSignResult({ status: "unavailable" })).toEqual({
      status: "unavailable",
    });
    expect(mediaUrlResultToSignResult({ status: "unexpected" })).toEqual({ status: "unavailable" });
    // A ready result that somehow lacks a url is treated as unavailable, not ready.
    expect(mediaUrlResultToSignResult({ status: "ready" })).toEqual({ status: "unavailable" });
  });
});

describe("G4.5 static coupling of the real consumer", () => {
  test("getPostMediaUrl now has a real client importer (build-graph coupling)", async () => {
    const files = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const importers = findLiteral(files, "getPostMediaUrl")
      .filter((file) => file.relativePath !== "src/lib/media/media-url.functions.ts")
      .map((file) => file.relativePath);

    expect(importers).toContain("src/lib/media/post-media-signer.ts");
  });

  test("the signer stays client-side and does not import a *.server.ts module", async () => {
    const files = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const signer = files.find((f) => f.relativePath === "src/lib/media/post-media-signer.ts");
    expect(signer).toBeDefined();
    expect(signer?.kind).toBe("client");
    expect(signer?.contents).toContain('from "./media-url.functions"');
    expect(signer?.contents.includes(".server")).toBe(false);
  });

  test("classifyPostMediaItem agrees with the shared contract", () => {
    expect(classifyPostMediaItem(canonicalMedia()).state).toBe("valid");
  });
});
