import { execFile } from "node:child_process";

/**
 * G4.27E — descoberta do stack Supabase LOCAL (somente leitura, somente Docker local).
 *
 * O objetivo e tornar o teste E2E auto-contido: o `supabase status` do CLI nao
 * resolve o stack local quando o `project_id` do `config.toml` aponta para o
 * projeto remoto (estado preexistente deste repositorio). Aqui a descoberta e
 * feita pelos containers Docker locais:
 *
 *   - `supabase_db_<id>`   -> container do PostgreSQL local (execucao de SQL);
 *   - `supabase_kong_<id>` -> config Kong com as credenciais locais
 *                             (`sb_secret_*` -> service role, `sb_publishable_*` -> anon).
 *
 * NUNCA conecta a um projeto remoto: a URL e sempre `http://127.0.0.1:54321`.
 */

export type LocalStack = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  dbContainer: string;
  projectId: string;
};

export const LOCAL_STACK_URL = "http://127.0.0.1:54321";

type RunResult = { code: number; out: string };

function run(cmd: string, args: string[], input?: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ code: error ? (error.code ?? 1) : 0, out: `${stdout}${stderr}` });
    });
    if (input !== undefined) child.stdin?.end(input);
  });
}

async function listContainer(prefix: string): Promise<string | null> {
  const listed = await run("docker", [
    "ps",
    "--filter",
    `name=${prefix}`,
    "--format",
    "{{.Names}}",
  ]);
  if (listed.code !== 0) return null;
  const name = listed.out
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith(prefix) && !line.includes(" "));
  return name ?? null;
}

/** Extrai as credenciais locais do config do Kong (sem imprimir valores). */
function parseKongCredentials(kongConfig: string): { anonKey: string; serviceRoleKey: string } | null {
  const service = /headers\.apikey == 'sb_secret_[^']*' and 'Bearer (eyJ[^']+)'/.exec(kongConfig);
  const anon = /headers\.apikey == 'sb_publishable_[^']*' and 'Bearer (eyJ[^']+)'/.exec(kongConfig);
  if (!service || !anon) return null;
  return { anonKey: anon[1], serviceRoleKey: service[1] };
}

/**
 * Descobre o stack local via Docker. Retorna `null` quando o stack nao existe
 * (o teste deve ser marcado como nao executavel, nunca aprovado silenciosamente).
 */
export async function discoverLocalStack(): Promise<LocalStack | null> {
  const dbContainer = await listContainer("supabase_db_");
  if (!dbContainer) return null;
  const projectId = dbContainer.replace(/^supabase_db_/, "");

  const kongContainer = await listContainer("supabase_kong_");
  if (!kongContainer) return null;
  const config = await run("docker", ["exec", kongContainer, "cat", "/home/kong/kong.yml"]);
  if (config.code !== 0) return null;
  const credentials = parseKongCredentials(config.out);
  if (!credentials) return null;

  return {
    url: LOCAL_STACK_URL,
    anonKey: credentials.anonKey,
    serviceRoleKey: credentials.serviceRoleKey,
    dbContainer,
    projectId,
  };
}

/** Garante que a URL alvo e o stack local (nunca um projeto remoto). */
export function isLocalStackUrl(url: string): boolean {
  try {
    const { hostname, port } = new URL(url);
    const localHosts = ["127.0.0.1", "localhost", "::1", "[::1]"];
    return localHosts.includes(hostname) && (port === "" || port === "54321");
  } catch {
    return false;
  }
}

/** Executa SQL no PostgreSQL LOCAL via `docker exec psql`. Lanca em caso de erro. */
export async function runLocalPsql(dbContainer: string, sql: string): Promise<string> {
  const result = await run(
    "docker",
    [
      "exec",
      "-i",
      dbContainer,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-tA",
      "-f",
      "-",
    ],
    sql,
  );
  if (result.code !== 0 || /ERROR/i.test(result.out)) {
    throw new Error(`local psql failed (code ${result.code}): ${result.out.slice(0, 500)}`);
  }
  return result.out;
}

/** Le um valor escalar do PostgreSQL local. */
export async function queryLocalPsql(dbContainer: string, sql: string): Promise<string> {
  const out = await runLocalPsql(dbContainer, sql);
  return out.trim();
}

export type LocalEnv = { url: string; anonKey: string; serviceRoleKey: string };

/**
 * Resolve as credenciais do stack LOCAL. O `process.env` so e aceito quando
 * aponta para o stack local (o `.env` do repo aponta para o projeto remoto e
 * por isso e ignorado). Retorna `null` quando nao ha stack local disponivel.
 */
export async function resolveLocalEnv(): Promise<{
  env: LocalEnv;
  stack: LocalStack | null;
} | null> {
  const stack = await discoverLocalStack();
  const fromProcess =
    process.env.SUPABASE_URL && process.env.ANON_KEY && process.env.SERVICE_ROLE_KEY
      ? {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.ANON_KEY,
          serviceRoleKey: process.env.SERVICE_ROLE_KEY,
        }
      : null;
  if (fromProcess && isLocalStackUrl(fromProcess.url)) {
    return { env: fromProcess, stack };
  }
  if (!stack) return null;
  return {
    env: { url: stack.url, anonKey: stack.anonKey, serviceRoleKey: stack.serviceRoleKey },
    stack,
  };
}
