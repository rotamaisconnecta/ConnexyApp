import { describe, expect, test } from "bun:test";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * G4.26D — cobertura de RUNTIME da semântica SQL real do guard
 * `private.g4_26b_is_canonical_avatar_path` (achado C-04 da auditoria G4.26C).
 *
 * Este teste NÃO simula a lógica em Node: ele carrega a definição REAL da função
 * a partir da migration e executa o matrix contra um PostgreSQL LOCAL, dentro de
 * uma transação revertida (`BEGIN ... ROLLBACK`). Nenhum objeto é persistido e
 * nenhuma conexão remota é feita.
 *
 * O ambiente local é descoberto automaticamente:
 *   1. `G4_TEST_PSQL_CONTAINER` (+ opcional `G4_TEST_PSQL_USER`/`G4_TEST_PSQL_DB`)
 *   2. um container Docker cujo nome comece com `supabase_db_`
 *
 * Se nenhum PostgreSQL local estiver disponível, o teste é PULADO (skipIf) —
 * nunca aprovado silenciosamente. Ver a limitação no relatório G4.26D.
 */

const ROOT = join(import.meta.dir, "..");
// G4.26B define o contrato (guard + RPC); G4.27B substitui SOMENTE o guard.
// Carregar as duas em ordem garante que o matrix exercite o guard EFETIVO,
// que é o estado aplicado no remoto (20261021042744).
const MIGRATIONS = [
  join(ROOT, "supabase/migrations/20261021042457_g4_26b_avatar_canonical_discovery_contract.sql"),
  join(
    ROOT,
    "supabase/migrations/20261021042744_g4_27b_avatar_c2_private_bucket_and_guard_hardening.sql",
  ),
];
const MATRIX = join(ROOT, "tests/sql/g4-26b-avatar-canonical-guard.sql");

type PsqlTarget = { container: string; user: string; database: string };

function run(cmd: string, args: string[], input?: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ code: error ? (error.code ?? 1) : 0, out: `${stdout}${stderr}` });
    });
    if (input !== undefined) {
      child.stdin?.end(input);
    }
  });
}

async function findLocalPsqlTarget(): Promise<PsqlTarget | null> {
  const user = process.env.G4_TEST_PSQL_USER ?? "postgres";
  const database = process.env.G4_TEST_PSQL_DB ?? "postgres";

  const explicit = process.env.G4_TEST_PSQL_CONTAINER;
  if (explicit) return { container: explicit, user, database };

  const list = await run("docker", [
    "ps",
    "--filter",
    "name=supabase_db_",
    "--format",
    "{{.Names}}",
  ]);
  if (list.code !== 0) return null;
  const container = list.out
    .split("\n")
    .map((line) => line.trim())
    .find((name) => name.startsWith("supabase_db_"));
  if (!container) return null;
  return { container, user, database };
}

function buildCombinedScript(migrationSql: string, matrixSql: string): string {
  return ["begin;", migrationSql, matrixSql, "select 'G4_26D_ROLLBACK';", "rollback;"].join("\n");
}

const target = await findLocalPsqlTarget();
const live = Boolean(target);

describe.skipIf(!live)("G4.26D guard SQL — runtime real (PostgreSQL local)", () => {
  test("matrix do guard passa integralmente e nada é persistido", async () => {
    if (!target) throw new Error("local PostgreSQL unavailable");
    const [migrationSql, matrixSql] = await Promise.all([
      Promise.all(MIGRATIONS.map((path) => readFile(path, "utf8"))).then((parts) =>
        parts.join("\n"),
      ),
      readFile(MATRIX, "utf8"),
    ]);

    const script = buildCombinedScript(migrationSql, matrixSql);
    const result = await run(
      "docker",
      [
        "exec",
        "-i",
        target.container,
        "psql",
        "-U",
        target.user,
        "-d",
        target.database,
        "-v",
        "ON_ERROR_STOP=1",
        "-tA",
        "-f",
        "-",
      ],
      script,
    );

    expect(result.out).not.toMatch(/ERROR/i);
    const passes = result.out.split("\n").filter((line) => line.endsWith("|PASS"));
    const failures = result.out.split("\n").filter((line) => line.endsWith("|FAIL"));
    expect(failures).toEqual([]);
    expect(passes.length).toBe(38);
    expect(result.out).toContain("G4_26D_ROLLBACK");
  });

  test("após o rollback, o guard não permanece no banco", async () => {
    if (!target) throw new Error("local PostgreSQL unavailable");
    const probe = await run("docker", [
      "exec",
      "-i",
      target.container,
      "psql",
      "-U",
      target.user,
      "-d",
      target.database,
      "-tA",
      "-c",
      "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and p.proname = 'g4_26b_is_canonical_avatar_path';",
    ]);
    expect(probe.out.trim()).toBe("0");
  });
});
