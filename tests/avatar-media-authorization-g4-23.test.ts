import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AVATAR_MEDIA_URL_TTL_SECONDS,
  createAvatarMediaUrlService,
} from "../src/lib/media/avatar-media-authorization.server";

const ROOT = join(import.meta.dir, "..");
const ORIGIN = "https://project.supabase.co";
const OWNER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const VIEWER = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

function service(
  photoUrl: string | null,
  overrides: Partial<Parameters<typeof createAvatarMediaUrlService>[0]> = {},
) {
  const sign = async (path: string, ttl: number) => {
    expect(path).toBe(`${OWNER}/avatar.jpg`);
    expect(ttl).toBe(AVATAR_MEDIA_URL_TTL_SECONDS);
    return `${ORIGIN}/storage/v1/object/sign/avatars/${path}?token=short-lived`;
  };
  return createAvatarMediaUrlService({
    viewerId: VIEWER,
    loadProfile: async (id) => (id === OWNER ? { id: OWNER, photo_url: photoUrl } : null),
    sign,
    trustedOrigin: ORIGIN,
    now: () => 1_000,
    ...overrides,
  });
}

describe("G4.23 authenticated avatar resolution", () => {
  test("rejects anonymous requests before reading a profile or signing", async () => {
    const loadProfile = async () => {
      throw new Error("must not load");
    };
    const resolver = createAvatarMediaUrlService({
      viewerId: null,
      loadProfile,
      sign: async () => {
        throw new Error("must not sign");
      },
    });
    expect(await resolver.getAvatarUrl(OWNER)).toEqual({ status: "forbidden" });
  });

  test("allows an authenticated viewer without a social-connection check", async () => {
    const resolver = service(`${OWNER}/avatar.jpg`);
    expect(await resolver.getAvatarUrl(OWNER)).toEqual({
      status: "ready",
      url: `${ORIGIN}/storage/v1/object/sign/avatars/${OWNER}/avatar.jpg?token=short-lived`,
      expiresAt: 181_000,
    });
  });

  test("signs legacy public and expired signed references from the database path", async () => {
    const publicResolver = service(
      `${ORIGIN}/storage/v1/object/public/avatars/${OWNER}/avatar.jpg`,
    );
    const expiredResolver = service(
      `${ORIGIN}/storage/v1/object/sign/avatars/${OWNER}/avatar.jpg?token=expired`,
    );
    for (const resolver of [publicResolver, expiredResolver]) {
      const result = await resolver.getAvatarUrl(OWNER);
      expect(result.status).toBe("ready");
      if (result.status === "ready") {
        expect(result.url).toContain("/object/sign/avatars/");
        expect(result.url).not.toContain("/object/public/");
      }
    }
  });

  test("rejects malformed, foreign-owner, and non-avatar storage references", async () => {
    for (const photoUrl of [
      "../avatar.jpg",
      `${VIEWER}/avatar.jpg`,
      `${ORIGIN}/storage/v1/object/public/bio-media/${OWNER}/avatar.jpg`,
    ]) {
      const result = await service(photoUrl).getAvatarUrl(OWNER);
      expect(result).toEqual({ status: "unavailable" });
    }
  });

  test("G4.26D a canonical path owned by another user is never authorized (C-05)", async () => {
    // The row for OWNER holds a canonical path whose first segment is VIEWER.
    // Even though the format is canonical, ownership must fail closed.
    expect(await service(`${VIEWER}/avatar.jpg`).getAvatarUrl(OWNER)).toEqual({
      status: "unavailable",
    });
    // And the same path under its real owner is signable.
    const owned = createAvatarMediaUrlService({
      viewerId: VIEWER,
      loadProfile: async (id) =>
        id === VIEWER ? { id: VIEWER, photo_url: `${VIEWER}/x.jpg` } : null,
      sign: async (path) =>
        path === `${VIEWER}/x.jpg`
          ? `${ORIGIN}/storage/v1/object/sign/avatars/${path}?token=short-lived`
          : null,
      trustedOrigin: ORIGIN,
      now: () => 1_000,
    });
    expect(await owned.getAvatarUrl(VIEWER)).toMatchObject({ status: "ready" });
  });

  test("returns missing for absent profiles and avatars, and fails closed on signer errors", async () => {
    expect(await service(null).getAvatarUrl(OWNER)).toEqual({ status: "missing" });
    expect(await service(`${OWNER}/avatar.jpg`).getAvatarUrl(VIEWER)).toEqual({
      status: "missing",
    });
    const signerFailure = service(`${OWNER}/avatar.jpg`, {
      sign: async () => {
        throw new Error("storage unavailable");
      },
    });
    expect(await signerFailure.getAvatarUrl(OWNER)).toEqual({ status: "unavailable" });
  });

  test("preserves valid external and local legacy references from the profile row", async () => {
    expect(
      await service("https://images.example.test/avatar.png").getAvatarUrl(OWNER),
    ).toMatchObject({
      status: "ready",
      url: "https://images.example.test/avatar.png",
    });
    expect(await service("blob:https://app.example.test/avatar").getAvatarUrl(OWNER)).toMatchObject(
      {
        status: "ready",
        url: "blob:https://app.example.test/avatar",
      },
    );
  });

  test("the server function accepts only a profile ID and never a caller-supplied URL or path", async () => {
    const source = await readFile(join(ROOT, "src/lib/media/avatar-media.functions.ts"), "utf8");
    expect(source).toContain("z.object({ profileId: z.string().uuid() })");
    expect(source).not.toContain("photoUrl:");
    expect(source).not.toContain("bucket:");
    expect(source).not.toContain("path:");
    expect(source).toContain("requireAppSupabaseAuth");
  });
});
