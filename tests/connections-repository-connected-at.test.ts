import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConnectionRow as SchemaAConnectionRow } from "../src/integrations/supabase/remote/types";
import type { ConnectionRow as LegacyConnectionRow } from "../src/types/phase-13b";

const projectRoot = join(import.meta.dir, "..");
const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const NOW = "2026-09-25T00:00:00.000Z";

describe("connections repository contract (connected_at)", () => {
  test("list() orders by the Schema A column connected_at", async () => {
    const source = await readFile(
      join(projectRoot, "src/repositories/connections.repository.ts"),
      "utf8",
    );
    const listStart = source.indexOf("async list(");
    const listEnd = source.indexOf("async remove(");
    expect(listStart).toBeGreaterThan(-1);
    expect(listEnd).toBeGreaterThan(listStart);

    const listBody = source.slice(listStart, listEnd);
    expect(listBody).toContain('.from("connections")');
    expect(listBody).toContain('.select("*")');
    expect(listBody).toContain('.order("connected_at")');
    expect(listBody).not.toContain('.order("created_at")');
  });

  test("legacy ConnectionRow mirrors the Schema A connections row", () => {
    const schemaARow: SchemaAConnectionRow = {
      connected_at: NOW,
      conversation_id: null,
      id: A,
      user_a_id: A,
      user_b_id: B,
    };
    const legacyRow: LegacyConnectionRow = schemaARow;
    expect(legacyRow.connected_at).toBe(NOW);
    expect(legacyRow.id).toBe(A);
    expect(legacyRow.user_a_id).toBe(A);
    expect(legacyRow.user_b_id).toBe(B);
    expect("created_at" in legacyRow).toBe(false);
  });
});
