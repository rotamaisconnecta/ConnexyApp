import { afterEach, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import {
  SCHEMA_A_DEFERRED_BUCKETS,
  SCHEMA_A_STORAGE_BUCKETS,
  buildSchemaAStorageObject,
  isOwnedStoragePath,
  isRemoteMediaPath,
  isSchemaAStorageEnabled,
  ownerIdFromStoragePath,
} from "../src/lib/storage/schema-a-storage";

const projectRoot = join(import.meta.dir, "..");
const UUID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

afterEach(() => {
  setRemoteAuthGateForTests(null);
});

async function walkFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      await walkFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

describe("1H-15 Schema A Storage buckets", () => {
  test("reuses the three existing buckets without duplicates", () => {
    const ids = Object.values(SCHEMA_A_STORAGE_BUCKETS);
    expect(ids).toEqual(["avatars", "bio-media", "reels-media"]);
    expect(new Set(ids).size).toBe(3);
    for (const deferred of SCHEMA_A_DEFERRED_BUCKETS) {
      expect(ids.includes(deferred)).toBe(false);
    }
  });

  test("demo keeps Storage disabled even if Auth flag and supabase are on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    expect(isSchemaAStorageEnabled()).toBe(false);
  });
});

describe("1H-15 Schema A Storage paths", () => {
  test("avatar and cover stay in avatars under auth.uid()", () => {
    const avatar = buildSchemaAStorageObject({
      ownerId: UUID,
      purpose: "avatar",
      objectId: OTHER,
      extension: "jpg",
    });
    expect(avatar.bucket).toBe("avatars");
    expect(avatar.path).toBe(`${UUID}/avatar/${OTHER}.jpg`);
    expect(isOwnedStoragePath(avatar.path, UUID)).toBe(true);

    const cover = buildSchemaAStorageObject({
      ownerId: UUID,
      purpose: "cover",
      objectId: OTHER,
      extension: "webp",
    });
    expect(cover.bucket).toBe("avatars");
    expect(cover.path.startsWith(`${UUID}/cover/`)).toBe(true);
  });

  test("bio and post media reuse bio-media", () => {
    const bio = buildSchemaAStorageObject({
      ownerId: UUID,
      purpose: "bio",
      objectId: OTHER,
      extension: "png",
    });
    expect(bio.bucket).toBe("bio-media");
    const post = buildSchemaAStorageObject({
      ownerId: UUID,
      purpose: "post",
      objectId: OTHER,
      extension: "webp",
    });
    expect(post.bucket).toBe("bio-media");
  });

  test("reel video and poster reuse reels-media", () => {
    const video = buildSchemaAStorageObject({
      ownerId: UUID,
      purpose: "reel",
      objectId: OTHER,
      extension: "mp4",
    });
    expect(video.bucket).toBe("reels-media");
    const poster = buildSchemaAStorageObject({
      ownerId: UUID,
      purpose: "reel-poster",
      objectId: OTHER,
      extension: "jpg",
    });
    expect(poster.bucket).toBe("reels-media");
    expect(poster.path).toBe(`${UUID}/reel-poster/${OTHER}.jpg`);
  });

  test("demo identity is not a Storage owner", () => {
    expect(() =>
      buildSchemaAStorageObject({
        ownerId: "lucas",
        purpose: "avatar",
        objectId: OTHER,
        extension: "jpg",
      }),
    ).toThrow();
    expect(ownerIdFromStoragePath("lucas/photo.jpg")).toBeNull();
    expect(isRemoteMediaPath("data:image/png;base64,abc")).toBe(false);
  });

  test("a path owned by another uid is rejected", () => {
    expect(isOwnedStoragePath(`${UUID}/avatar/${OTHER}.jpg`, OTHER)).toBe(false);
  });
});

describe("1H-15 Schema A Storage isolation", () => {
  test("Storage contract does not import a client or the demo identity helper", async () => {
    const text = await readFile(join(projectRoot, "src/lib/storage/schema-a-storage.ts"), "utf8");
    expect(text.includes("getDemoIdentity(")).toBe(false);
    expect(text.includes("@/lib/supabase/client")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
    expect(text.includes("createClient")).toBe(false);
    expect(text.includes("MOCK_REELS")).toBe(false);
  });

  test("domain UI does not import Schema A Storage yet", async () => {
    const hits: string[] = [];
    for (const root of ["src/routes", "src/components", "src/hooks", "src/providers"]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-storage")) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  test("remote repositories and adapters were not rewritten for Storage", async () => {
    const hits: string[] = [];
    for (const root of ["src/integrations/supabase/remote", "src/lib/adapters/schema-a"]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-storage")) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
