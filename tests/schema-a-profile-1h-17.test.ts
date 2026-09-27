import { afterEach, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import type { DemoOwnProfile } from "../src/lib/demo/demo-own-profile";
import type { ProfilePrivateRow, ProfileRow } from "../src/integrations/supabase/remote/types";
import {
  isRemoteProfileEnabled,
  isSchemaAProfileFlagEnabled,
  setRemoteProfileGateForTests,
} from "../src/lib/profile/schema-a-profile-flag";
import {
  SchemaAProfileError,
  SchemaAProfileErrorCode,
  createSchemaAProfile,
  isCopyOnceEligible,
  mappedProfileForRemote,
  type SchemaAProfilePort,
} from "../src/lib/profile/schema-a-profile";

const projectRoot = join(import.meta.dir, "..");
const UUID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const NOW = "2026-09-25T00:00:00.000Z";

afterEach(() => {
  setRemoteAuthGateForTests(null);
  setRemoteProfileGateForTests(null);
});

function triggerHandle(id: string): string {
  return `u${id.replace(/-/g, "").slice(0, 16)}`;
}

function defaultVisibility() {
  return {
    confirmed_activity: "connections",
    liked_places: "connections",
    mutual_connections: "everyone",
  };
}

function seedPublic(id: string, overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id,
    name: triggerHandle(id),
    handle: triggerHandle(id),
    photo_url: null,
    cover_url: null,
    city: null,
    bio: null,
    interests: [],
    age: null,
    locale: null,
    visibility: defaultVisibility(),
    headline: null,
    looks_for: [],
    mood_emoji: null,
    mood_text: null,
    now_playing_kind: null,
    now_playing_subtitle: null,
    now_playing_title: null,
    vibe_tags: [],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function seedPrivate(id: string, overrides: Partial<ProfilePrivateRow> = {}): ProfilePrivateRow {
  return {
    user_id: id,
    birth_date: null,
    home_address: null,
    work_address: null,
    updated_at: NOW,
    ...overrides,
  };
}

function memoryPort(
  ownerId: string,
  extra?: { otherPrivate?: ProfilePrivateRow },
): { port: SchemaAProfilePort; calls: string[] } {
  const calls: string[] = [];
  let publicRow = seedPublic(ownerId);
  let privateRow = seedPrivate(ownerId);
  const port: SchemaAProfilePort = {
    async getOwn() {
      calls.push("getOwn");
      return publicRow;
    },
    async updateOwn(patch) {
      calls.push("updateOwn");
      publicRow = { ...publicRow, ...patch, updated_at: NOW };
      return publicRow;
    },
    async getOwnPrivate() {
      calls.push("getOwnPrivate");
      return privateRow;
    },
    async getPrivateByUserId(userId) {
      calls.push(`getPrivateByUserId:${userId}`);
      if (userId === ownerId) return privateRow;
      return extra?.otherPrivate ?? null;
    },
    async updateOwnPrivate(patch) {
      calls.push("updateOwnPrivate");
      privateRow = { ...privateRow, ...patch, user_id: ownerId, updated_at: NOW };
      return privateRow;
    },
  };
  return { port, calls };
}

function sampleLocal(identityId: string): DemoOwnProfile {
  return {
    name: "Ana",
    handle: "ana",
    photo: "data:image/png;base64,abc",
    cover: "https://images.unsplash.com/mock",
    city: "Recife",
    bio: "Olá",
    interests: ["Música", "Cafés", "Cinema"],
    privateAddresses: { home: "Rua A", work: "Rua B" },
    visibility: {
      confirmedActivity: "Todos",
      likedPlaces: "Conexões",
      mutualFriends: "Somente você",
    },
    age: 30,
    birthDate: "1994-04-04",
    identityId,
  };
}

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

describe("1H-17 Profile flag", () => {
  test("Demo keeps Profile cutover off even if both flags are on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteProfileGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteProfileEnabled()).toBe(false);
    expect(typeof isSchemaAProfileFlagEnabled()).toBe("boolean");
  });

  test("Auth on without Profile flag keeps Demo Profile", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteProfileGateForTests({ isFlagEnabled: () => false });
    expect(isRemoteProfileEnabled()).toBe(false);
  });

  test("Auth + Profile flags enable remote Profile", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteProfileGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteProfileEnabled()).toBe(true);
  });
});

describe("1H-17 Remote Profile", () => {
  test("remote identity is the Auth UUID, not getDemoIdentity()", async () => {
    const { port, calls } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: UUID }),
      profiles: port,
    });
    const identity = await profile.getIdentity();
    expect(identity).toEqual({ userId: UUID });
    expect(identity?.userId).not.toBe(getDemoIdentity().id);
    const loaded = await profile.loadOwn();
    expect(loaded.identityId).toBe(UUID);
    expect(calls).toContain("getOwn");
    expect(calls).toContain("getOwnPrivate");
  });

  test("write then reload preserves remote state without localStorage", async () => {
    const { port, calls } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: UUID }),
      profiles: port,
    });
    const saved = await profile.saveOwn(sampleLocal(UUID));
    expect(saved.name).toBe("Ana");
    expect(saved.handle).toBe("ana");
    expect(saved.city).toBe("Recife");
    expect(saved.privateAddresses.home).toBe("Rua A");
    expect(saved.birthDate).toBe("1994-04-04");
    const reloaded = await profile.loadOwn();
    expect(reloaded.name).toBe("Ana");
    expect(reloaded.handle).toBe("ana");
    expect(calls.filter((item) => item === "updateOwn")).toEqual(["updateOwn"]);
    expect(calls).toContain("updateOwnPrivate");
  });

  test("data URLs are not written to photo_url", async () => {
    const { port } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: UUID }),
      profiles: port,
    });
    const saved = await profile.saveOwn(sampleLocal(UUID));
    expect(saved.photo).toBe("");
    const mapped = mappedProfileForRemote(sampleLocal("lucas"));
    expect(mapped.photo).toBe("");
  });

  test("logout leaves no remote identity", async () => {
    let session: { userId: string } | null = { userId: UUID };
    const { port, calls } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => session,
      profiles: port,
    });
    expect(await profile.getIdentity()).toEqual({ userId: UUID });
    session = null;
    expect(await profile.getIdentity()).toBeNull();
    try {
      await profile.loadOwn();
      throw new Error("expected no session");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaAProfileError);
      expect((error as SchemaAProfileError).code).toBe(SchemaAProfileErrorCode.NO_SESSION);
    }
    expect(calls.includes("getOwn")).toBe(false);
  });

  test("RLS-style private peek returns null for another user", async () => {
    const { port, calls } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: UUID }),
      profiles: port,
    });
    expect(await profile.peekPrivate(OTHER)).toBeNull();
    expect(calls).toContain(`getPrivateByUserId:${OTHER}`);
  });

  test("copy-once skips demo identity and copies only when UUID matches placeholder handle", async () => {
    expect(isCopyOnceEligible(sampleLocal("lucas"), UUID)).toBe(false);
    const { port } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: UUID }),
      profiles: port,
    });
    expect(await profile.copyMappedFieldsOnce(sampleLocal("lucas"))).toBe("skipped");
    expect(await profile.copyMappedFieldsOnce(sampleLocal(UUID))).toBe("copied");
    const loaded = await profile.loadOwn();
    expect(loaded.name).toBe("Ana");
    expect(loaded.handle).toBe("ana");
    expect(await profile.copyMappedFieldsOnce(sampleLocal(UUID))).toBe("skipped");
  });

  test("disabled Profile makes zero repository calls", async () => {
    const { port, calls } = memoryPort(UUID);
    const profile = createSchemaAProfile({
      isEnabled: () => false,
      getIdentity: async () => ({ userId: UUID }),
      profiles: port,
    });
    expect(profile.isEnabled()).toBe(false);
    expect(await profile.getIdentity()).toBeNull();
    try {
      await profile.loadOwn();
      throw new Error("expected disabled");
    } catch (error) {
      expect((error as SchemaAProfileError).code).toBe(SchemaAProfileErrorCode.DISABLED);
    }
    expect(calls).toEqual([]);
  });
});

describe("1H-17 isolation", () => {
  test("remote Profile module does not call getDemoIdentity(", async () => {
    const text = await readFile(join(projectRoot, "src/lib/profile/schema-a-profile.ts"), "utf8");
    expect(text.includes("getDemoIdentity(")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
  });

  test("other domains are not wired to the Profile cutover", async () => {
    const hits: string[] = [];
    const allowed = new Set([
      join(projectRoot, "src/routes/_app.perfil.index.tsx"),
      join(projectRoot, "src/routes/completar-perfil.tsx"),
      join(projectRoot, "src/routes/interesses.tsx"),
    ]);
    for (const root of [
      "src/routes",
      "src/components",
      "src/hooks",
      "src/lib/carona",
      "src/lib/catalog",
      "src/lib/reservations",
      "src/lib/reels",
      "src/lib/chat",
    ]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-profile") && !allowed.has(file)) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
