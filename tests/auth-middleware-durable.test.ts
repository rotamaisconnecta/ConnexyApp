import { describe, expect, test } from "bun:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  requireAppSupabaseAuth,
  verifySupabaseBearer,
  type SupabaseAuthVerifierDeps,
} from "../src/lib/supabase/auth-middleware";
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY,
  PUBLIC_SUPABASE_URL_KEY,
  resolveSupabasePublicConfig,
  SERVER_SUPABASE_PUBLISHABLE_KEY_KEY,
  SERVER_SUPABASE_URL_KEY,
  SupabaseEnvError,
} from "../src/lib/supabase/external-env";

const projectRoot = join(import.meta.dir, "..");

const CONFIG = { url: "https://project.supabase.co", key: "sb_publishable_project" };
const VALID_TOKEN = "header.payload.signature";

type ClaimsLike = { sub?: string; [key: string]: unknown };

function fakeDeps(
  result: { data: { claims: ClaimsLike }; error: null } | { data: null; error: Error },
  onCall?: (url: string, key: string, token: string) => void,
  onGetClaims?: (jwt: string | undefined) => void,
): SupabaseAuthVerifierDeps {
  return {
    createAuthClient: ((url: string, key: string, token: string) => {
      onCall?.(url, key, token);
      return {
        auth: {
          getClaims: async (jwt?: string) => {
            onGetClaims?.(jwt);
            return result;
          },
        },
      } as unknown as SupabaseClient;
    }) as SupabaseAuthVerifierDeps["createAuthClient"],
  };
}

async function walkFiles(dir: string, acc: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
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

describe("Marco A1.2 — comportamento de autenticação (repo-owned)", () => {
  test("rejeita ausência de header de autorização", async () => {
    await expect(
      verifySupabaseBearer(null, CONFIG, fakeDeps({ data: null, error: new Error("x") })),
    ).rejects.toThrow("No authorization header provided");
    await expect(verifySupabaseBearer(undefined, CONFIG)).rejects.toThrow(
      "No authorization header provided",
    );
  });

  test("rejeita esquema diferente de Bearer", async () => {
    await expect(verifySupabaseBearer("Basic abc", CONFIG)).rejects.toThrow(
      "Only Bearer tokens are supported",
    );
  });

  test("rejeita Bearer sem token", async () => {
    await expect(verifySupabaseBearer("Bearer ", CONFIG)).rejects.toThrow("No token provided");
  });

  test("rejeita token malformado sem chamar o cliente de auth", async () => {
    let called = false;
    await expect(
      verifySupabaseBearer("Bearer not-a-jwt", CONFIG, {
        createAuthClient: (() => {
          called = true;
          return {} as SupabaseClient;
        }) as SupabaseAuthVerifierDeps["createAuthClient"],
      }),
    ).rejects.toThrow("Invalid token");
    expect(called).toBe(false);
  });

  test("rejeita token cujo getClaims retorna erro", async () => {
    await expect(
      verifySupabaseBearer(
        `Bearer ${VALID_TOKEN}`,
        CONFIG,
        fakeDeps({ data: null, error: new Error("bad") }),
      ),
    ).rejects.toThrow("Invalid token");
  });

  test("rejeita token sem claims", async () => {
    await expect(
      verifySupabaseBearer(
        `Bearer ${VALID_TOKEN}`,
        CONFIG,
        fakeDeps({ data: null, error: new Error("bad") }),
      ),
    ).rejects.toThrow("Invalid token");
  });

  test("rejeita claims sem userId", async () => {
    await expect(
      verifySupabaseBearer(
        `Bearer ${VALID_TOKEN}`,
        CONFIG,
        fakeDeps({ data: { claims: { role: "authenticated" } }, error: null }),
      ),
    ).rejects.toThrow("No user ID found in token");
  });

  test("sucesso devolve o contexto { supabase, userId, claims } exigido pelo framework", async () => {
    const calls: string[] = [];
    let created: SupabaseClient | null = null;
    const claims: ClaimsLike = { sub: "user-123", role: "authenticated" };
    const deps: SupabaseAuthVerifierDeps = {
      createAuthClient: ((url: string, key: string, token: string) => {
        calls.push(`create:${url}:${key}:${token}`);
        created = {
          auth: {
            getClaims: async (jwt?: string) => {
              calls.push(`getClaims:${jwt}`);
              return { data: { claims }, error: null };
            },
          },
        } as unknown as SupabaseClient;
        return created;
      }) as SupabaseAuthVerifierDeps["createAuthClient"],
    };

    const result = await verifySupabaseBearer(`Bearer ${VALID_TOKEN}`, CONFIG, deps);

    expect(result.userId).toBe("user-123");
    expect(result.claims.sub).toBe("user-123");
    expect(result.supabase).toBe(created!);
    expect(calls).toEqual([
      `create:${CONFIG.url}:${CONFIG.key}:${VALID_TOKEN}`,
      `getClaims:${VALID_TOKEN}`,
    ]);
  });

  test("não acessa rede no caminho inválido (falha antes do cliente)", async () => {
    await expect(verifySupabaseBearer("Bearer bad.token", CONFIG)).rejects.toThrow("Invalid token");
  });
});

describe("Marco A1.2 — configuração canônica preservada (external-env)", () => {
  const SERVER = {
    [SERVER_SUPABASE_URL_KEY]: "https://server.supabase.co",
    [SERVER_SUPABASE_PUBLISHABLE_KEY_KEY]: "sb_publishable_server",
  };
  const PUBLIC = {
    [PUBLIC_SUPABASE_URL_KEY]: "https://public.supabase.co",
    [PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY]: "sb_publishable_public",
  };

  test("usa APP_* quando o namespace público está ausente", () => {
    expect(resolveSupabasePublicConfig(SERVER, {})).toEqual({
      url: "https://server.supabase.co",
      key: "sb_publishable_server",
    });
  });

  test("cai para o namespace público quando APP_* ausente", () => {
    expect(resolveSupabasePublicConfig({}, PUBLIC)).toEqual({
      url: "https://public.supabase.co",
      key: "sb_publishable_public",
    });
  });

  test("APP_* e VITE_APP_* iguais são aceitos (precedência sem conflito)", () => {
    expect(resolveSupabasePublicConfig(PUBLIC, PUBLIC)).toEqual({
      url: "https://public.supabase.co",
      key: "sb_publishable_public",
    });
  });

  test("conflito entre APP_* e VITE_APP_* falha em vez de escolher", () => {
    expect(() => resolveSupabasePublicConfig(SERVER, PUBLIC)).toThrow(SupabaseEnvError);
  });

  test("ausência de configuração falha nomeando as variáveis", () => {
    expect(() => resolveSupabasePublicConfig({}, {})).toThrow(SupabaseEnvError);
  });
});

describe("Marco A1.2 — fiação durável (não depende de código gerado)", () => {
  test("o consumidor vivo usa o middleware repo-owned", async () => {
    const text = await readFile(join(projectRoot, "src/lib/media/media-url.functions.ts"), "utf8");
    expect(text).toContain('from "@/lib/supabase/auth-middleware"');
    expect(text).toContain("requireAppSupabaseAuth");
    expect(text.includes('from "@/integrations/supabase/auth-middleware"')).toBe(false);
  });

  test("nenhum arquivo em src importa o middleware gerado", async () => {
    const hits: string[] = [];
    for (const file of await walkFiles(join(projectRoot, "src"))) {
      const text = await readFile(file, "utf8");
      if (text.includes('from "@/integrations/supabase/auth-middleware"')) {
        hits.push(file.slice(projectRoot.length + 1));
      }
    }
    expect(hits).toEqual([]);
  });

  test("o middleware repo-owned reutiliza o resolvedor canônico e não lê a service role", async () => {
    const text = await readFile(join(projectRoot, "src/lib/supabase/auth-middleware.ts"), "utf8");
    expect(text).toContain("resolveServerSupabasePublicConfig");
    expect(text).toContain("./external-env");
    expect(text.includes("SERVICE_ROLE")).toBe(false);
    expect(text.includes("APP_SUPABASE_SERVICE_ROLE")).toBe(false);
  });

  test("o contrato de middleware do framework é preservado", () => {
    expect(requireAppSupabaseAuth.options.type).toBe("function");
    expect(typeof requireAppSupabaseAuth.options.server).toBe("function");
  });
});
