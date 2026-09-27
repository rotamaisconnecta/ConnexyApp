import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SchemaADatabase } from "../src/integrations/supabase/schema-a-database";
import { createSchemaAClient } from "../src/integrations/supabase/remote/client";

const projectRoot = join(import.meta.dir, "..");

const SCHEMA_A_TABLES = [
  "profiles",
  "profile_private",
  "follows",
  "connection_requests",
  "connections",
  "conversations",
  "conversation_participants",
  "messages",
  "posts",
  "reels",
  "reel_likes",
  "reel_comments",
  "businesses",
  "places",
  "events",
  "offers",
  "reservations",
  "carona_offers",
  "carona_requests",
  "saves",
] as const satisfies ReadonlyArray<keyof SchemaADatabase["public"]["Tables"]>;

const LEGACY_ISOLATED = ["bio_posts", "blocked_users", "user_locations", "user_presence"] as const;

const TYPES_TS_DIRECT = [
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.server.ts",
  "src/lib/supabase/rpc.ts",
  "src/lib/supabase/database.ts",
  "src/integrations/supabase/client.ts",
  "src/integrations/supabase/auth-middleware.ts",
  "src/types/database/database.types.ts",
  "src/types/database/tables.ts",
  "src/types/database/views.ts",
  "src/types/database/rpc.ts",
] as const;

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

describe("1H-16 Schema A client types", () => {
  test("Schema A client is typed with the generated dump via the contract module", () => {
    expect(SCHEMA_A_TABLES).toHaveLength(20);
    createSchemaAClient("http://example.invalid", "anon-key");
  });

  test("contract module re-exports the dump and does not import legacy Database types", async () => {
    const text = await readFile(
      join(projectRoot, "src/integrations/supabase/schema-a-database.ts"),
      "utf8",
    );
    expect(text.includes("supabase/schema-a.generated.ts")).toBe(true);
    expect(text.includes('from "./types"')).toBe(false);
    expect(text.includes("@/integrations/supabase/types")).toBe(false);
  });

  test("legacy types.ts stays the six-table skeleton", async () => {
    const text = await readFile(join(projectRoot, "src/integrations/supabase/types.ts"), "utf8");
    expect(text.includes("bio_posts")).toBe(true);
    expect(text.includes("profile_private")).toBe(false);
    expect(text.includes("schema-a.generated")).toBe(false);
  });

  test("direct types.ts importers are the known legacy set", async () => {
    const hits: string[] = [];
    for (const file of await walkFiles(join(projectRoot, "src"))) {
      const text = await readFile(file, "utf8");
      if (
        text.includes("@/integrations/supabase/types") ||
        (file.endsWith("integrations/supabase/client.ts") && text.includes('from "./types"')) ||
        (file.endsWith("integrations/supabase/auth-middleware.ts") &&
          text.includes('from "./types"'))
      ) {
        hits.push(file.slice(projectRoot.length + 1));
      }
    }
    expect(hits.sort()).toEqual([...TYPES_TS_DIRECT].sort());
  });

  test("remote repositories do not query isolated legacy tables", async () => {
    const files = await walkFiles(join(projectRoot, "src/integrations/supabase/remote"));
    for (const file of files) {
      if (file.endsWith("schema-a-database.ts")) continue;
      const text = await readFile(file, "utf8");
      for (const table of LEGACY_ISOLATED) {
        expect(text.includes(`.from("${table}")`)).toBe(false);
      }
    }
  });

  test("domain UI is not wired to the Schema A client contract", async () => {
    const hits: string[] = [];
    for (const root of ["src/routes", "src/components", "src/hooks", "src/providers"]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-database") || text.includes("createSchemaAClient")) {
          hits.push(file);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
