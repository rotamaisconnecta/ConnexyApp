import { afterEach, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  isRemoteAuthEnabled,
  isSchemaAAuthFlagEnabled,
  setRemoteAuthGateForTests,
} from "../src/lib/auth/schema-a-auth-flag";
import {
  createSchemaAAuth,
  getSchemaAAuth,
  profileIdFromRemoteAuth,
  resetSchemaAAuthSingletonForTests,
  SchemaAAuthError,
  SchemaAAuthErrorCode,
  type SchemaAAuthPort,
} from "../src/lib/auth/schema-a-auth";

const projectRoot = join(import.meta.dir, "..");
const UUID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

afterEach(() => {
  setRemoteAuthGateForTests(null);
  resetSchemaAAuthSingletonForTests();
});

function mockPort(overrides: Partial<{ userId: string | null; calls: string[] }>): SchemaAAuthPort {
  const calls = overrides.calls ?? [];
  let userId: string | null = overrides.userId === undefined ? UUID : overrides.userId;
  return {
    async getUser() {
      calls.push("getUser");
      return { data: { user: userId ? { id: userId } : null }, error: null };
    },
    async signInWithPassword() {
      calls.push("signInWithPassword");
      userId = UUID;
      return { data: { user: { id: UUID } }, error: null };
    },
    async signOut() {
      calls.push("signOut");
      userId = null;
      return { error: null };
    },
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

describe("1H-14 Schema A Auth flag", () => {
  test("demo on disables remote Auth even if the flag and supabase are on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    expect(isRemoteAuthEnabled()).toBe(false);
  });

  test("flag off keeps Auth disabled when demo is off", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => false,
      isPublicSupabaseConfigured: () => true,
    });
    expect(isRemoteAuthEnabled()).toBe(false);
  });

  test("flag on + demo off + configured enables Auth", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    expect(isRemoteAuthEnabled()).toBe(true);
  });

  test("demo mode env helper remains a separate flag", () => {
    expect(typeof isSchemaAAuthFlagEnabled()).toBe("boolean");
  });
});

describe("1H-14 Schema A Auth session", () => {
  test("session absent returns null and does not invent an identity", async () => {
    const calls: string[] = [];
    const auth = createSchemaAAuth({
      isEnabled: () => true,
      auth: mockPort({ userId: null, calls }),
    });
    expect(await auth.getIdentity()).toBeNull();
    expect(calls).toEqual(["getUser"]);
  });

  test("session present returns auth.user.id as UUID", async () => {
    const auth = createSchemaAAuth({
      isEnabled: () => true,
      auth: mockPort({ userId: UUID }),
    });
    const identity = await auth.getIdentity();
    expect(identity).toEqual({ userId: UUID });
    expect(profileIdFromRemoteAuth(identity!)).toBe(UUID);
  });

  test("non-UUID auth id is rejected", async () => {
    const auth = createSchemaAAuth({
      isEnabled: () => true,
      auth: mockPort({ userId: "lucas" }),
    });
    await expect(auth.getIdentity()).rejects.toThrow();
  });

  test("logout clears the remote identity", async () => {
    const calls: string[] = [];
    const auth = createSchemaAAuth({
      isEnabled: () => true,
      auth: mockPort({ userId: UUID, calls }),
    });
    expect(await auth.getIdentity()).toEqual({ userId: UUID });
    await auth.signOut();
    expect(await auth.getIdentity()).toBeNull();
    expect(calls).toContain("signOut");
  });

  test("sign-in when disabled does not call Auth", async () => {
    const calls: string[] = [];
    const auth = createSchemaAAuth({
      isEnabled: () => false,
      auth: mockPort({ calls }),
    });
    expect(await auth.getIdentity()).toBeNull();
    expect(calls).toEqual([]);
    try {
      await auth.signIn("a@b.c", "secret");
      throw new Error("expected disabled");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaAAuthError);
      expect((error as SchemaAAuthError).code).toBe(SchemaAAuthErrorCode.DISABLED);
    }
    expect(calls).toEqual([]);
    await auth.signOut();
    expect(calls).toEqual([]);
  });
});

describe("1H-14 Demo vs Remote identity", () => {
  test("getDemoIdentity stays independent of remote Auth", () => {
    const demo = getDemoIdentity();
    expect(demo.id).toBe("lucas");
    expect(demo.id).not.toBe(UUID);
  });

  test("remote identity does not call getDemoIdentity", async () => {
    const files = await walkFiles(join(projectRoot, "src/lib/auth"));
    const authFiles = files.filter((file) => file.includes("schema-a-auth"));
    expect(authFiles.length).toBeGreaterThan(0);
    for (const file of authFiles) {
      const text = await readFile(file, "utf8");
      expect(text.includes("getDemoIdentity(")).toBe(false);
    }
  });

  test("domain UI does not import Schema A Auth yet", async () => {
    const hits: string[] = [];
    for (const root of ["src/routes", "src/components", "src/hooks", "src/providers"]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-auth")) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  test("Auth reuses the existing browser client and does not duplicate URL/key", async () => {
    const text = await readFile(join(projectRoot, "src/lib/auth/schema-a-auth.ts"), "utf8");
    expect(text.includes("@/lib/supabase/client")).toBe(true);
    expect(text.includes("createClient")).toBe(false);
    expect(text.includes("createBrowserClient")).toBe(false);
    expect(text.includes("VITE_APP_SUPABASE_URL")).toBe(false);
    expect(text.includes("createSchemaAClient")).toBe(false);
  });

  test("demo gate: zero Auth calls and zero network", async () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    const fetches: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      fetches.push(String(input));
      throw new Error("unexpected fetch in demo");
    }) as typeof fetch;
    try {
      const auth = getSchemaAAuth();
      expect(auth.isEnabled()).toBe(false);
      expect(await auth.getIdentity()).toBeNull();
      await auth.signOut();
      try {
        await auth.signIn("user@example.com", "not-used");
        throw new Error("expected disabled");
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaAAuthError);
        expect((error as SchemaAAuthError).code).toBe(SchemaAAuthErrorCode.DISABLED);
      }
      expect(fetches).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
