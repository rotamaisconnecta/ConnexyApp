import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonicalUserPair } from "../src/integrations/supabase/remote/canonical";
import { createSchemaAClient } from "../src/integrations/supabase/remote/client";
import {
  mapPostgrestError,
  RemoteErrorCode,
  RemoteRepositoryError,
} from "../src/integrations/supabase/remote/errors";

const projectRoot = join(import.meta.dir, "..");

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

describe("1H-11 remote repositories — unit", () => {
  test("canonical pair is ordered and rejects self", () => {
    const pair = canonicalUserPair(
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    expect(pair.user_a_id < pair.user_b_id).toBe(true);
    expect(() => canonicalUserPair("same", "same")).toThrow(RemoteRepositoryError);
    try {
      canonicalUserPair("same", "same");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    }
  });

  test("maps auth, RLS, not found, unique, check, FK, network", () => {
    expect(mapPostgrestError({ message: "JWT expired", code: "PGRST301" }).code).toBe(
      RemoteErrorCode.AUTH,
    );
    expect(
      mapPostgrestError({ message: "new row violates row-level security policy" }, 403).code,
    ).toBe(RemoteErrorCode.RLS);
    expect(mapPostgrestError({ message: "permission denied", code: "42501" }).code).toBe(
      RemoteErrorCode.RLS,
    );
    expect(
      mapPostgrestError({
        message: "JSON object requested, multiple (or no) rows",
        code: "PGRST116",
      }).code,
    ).toBe(RemoteErrorCode.NOT_FOUND);
    expect(mapPostgrestError({ message: "duplicate key", code: "23505" }).code).toBe(
      RemoteErrorCode.UNIQUE,
    );
    expect(mapPostgrestError({ message: "violates check constraint", code: "23514" }).code).toBe(
      RemoteErrorCode.CHECK,
    );
    expect(mapPostgrestError({ message: "violates foreign key", code: "23503" }).code).toBe(
      RemoteErrorCode.FOREIGN_KEY,
    );
    expect(mapPostgrestError({ message: "Failed to fetch" }).code).toBe(RemoteErrorCode.NETWORK);
  });

  test("schema A client refuses empty credentials without hiding the failure", () => {
    try {
      createSchemaAClient("", "");
      throw new Error("expected validation");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    }
  });

  test("demo UI, routes and hooks do not import the remote layer", async () => {
    const roots = [
      join(projectRoot, "src/routes"),
      join(projectRoot, "src/components"),
      join(projectRoot, "src/hooks"),
      join(projectRoot, "src/providers"),
      join(projectRoot, "src/services"),
    ];
    const hits: string[] = [];
    for (const root of roots) {
      const files = await walkFiles(root);
      for (const file of files) {
        const text = await readFile(file, "utf8");
        if (text.includes("integrations/supabase/remote")) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  test("remote layer does not reuse ChatRepository, types.ts or getDemoIdentity", async () => {
    const files = await walkFiles(join(projectRoot, "src/integrations/supabase/remote"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = await readFile(file, "utf8");
      expect(text.includes("chat.repository")).toBe(false);
      expect(text.includes("integrations/supabase/types")).toBe(false);
      expect(text.includes("getDemoIdentity")).toBe(false);
      expect(text.includes("ChatRepository")).toBe(false);
    }
  });

  test("generated Schema A dump is the type source", async () => {
    const contract = await readFile(
      join(projectRoot, "src/integrations/supabase/schema-a-database.ts"),
      "utf8",
    );
    expect(contract.includes("supabase/schema-a.generated.ts")).toBe(true);
    expect(contract.includes("integrations/supabase/types")).toBe(false);
    const client = await readFile(
      join(projectRoot, "src/integrations/supabase/remote/client.ts"),
      "utf8",
    );
    expect(client.includes("schema-a-database")).toBe(true);
    expect(client.includes("integrations/supabase/types")).toBe(false);
    const official = await readFile(
      join(projectRoot, "src/integrations/supabase/types.ts"),
      "utf8",
    );
    expect(official.includes("schema-a.generated")).toBe(false);
  });
});
