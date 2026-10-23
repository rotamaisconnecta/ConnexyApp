/**
 * Leitura uniforme das variáveis PÚBLICAS de Supabase (URL + publishable key).
 *
 * Contextos:
 *  - Navegador: lê somente o namespace público `VITE_APP_*`.
 *  - Servidor: usa `APP_*` (namespace server-side) com fallback para
 *    `VITE_APP_*` público, aceitando ambos para preservar compatibilidade.
 *
 * Regras:
 *  - Precedência explícita: `APP_*` (servidor) > `VITE_APP_*` (público).
 *  - Conflito: se ambos estiverem definidos e divergirem, falha em vez de
 *    escolher um silenciosamente.
 *  - Ausência: falha nomeando as variáveis ausentes, sem expor valores.
 *  - Nunca lê `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (service role/admin).
 */

export type EnvRecord = Record<string, string | undefined>;

export type SupabasePublicConfig = {
  url: string;
  key: string;
};

export class SupabaseEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseEnvError";
  }
}

export const SERVER_SUPABASE_URL_KEY = "APP_SUPABASE_URL";
export const SERVER_SUPABASE_PUBLISHABLE_KEY_KEY = "APP_SUPABASE_PUBLISHABLE_KEY";
export const PUBLIC_SUPABASE_URL_KEY = "VITE_APP_SUPABASE_URL";
export const PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY = "VITE_APP_SUPABASE_PUBLISHABLE_KEY";

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function resolveOne(
  serverEnv: EnvRecord,
  publicEnv: EnvRecord,
  serverKey: string,
  publicKey: string,
) {
  const serverValue = clean(serverEnv[serverKey]);
  const publicValue = clean(publicEnv[publicKey]);

  if (serverValue && publicValue && serverValue !== publicValue) {
    throw new SupabaseEnvError(
      `Conflicting Supabase configuration: ${serverKey} and ${publicKey} are both set but differ. ` +
        `Point them at the same project or unset one of them.`,
    );
  }

  return serverValue ?? publicValue;
}

/**
 * Resolve a configuração pública a partir de dois mapas de ambiente.
 * Puro e testável — não acessa `process.env` nem `import.meta.env` diretamente.
 */
export function resolveSupabasePublicConfig(
  serverEnv: EnvRecord,
  publicEnv: EnvRecord,
): SupabasePublicConfig {
  const url = resolveOne(serverEnv, publicEnv, SERVER_SUPABASE_URL_KEY, PUBLIC_SUPABASE_URL_KEY);
  const key = resolveOne(
    serverEnv,
    publicEnv,
    SERVER_SUPABASE_PUBLISHABLE_KEY_KEY,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY,
  );

  const missing = [
    ...(!url ? [`${SERVER_SUPABASE_URL_KEY} or ${PUBLIC_SUPABASE_URL_KEY}`] : []),
    ...(!key
      ? [`${SERVER_SUPABASE_PUBLISHABLE_KEY_KEY} or ${PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY}`]
      : []),
  ];

  if (missing.length > 0) {
    throw new SupabaseEnvError(
      `Missing external Supabase environment variable(s): ${missing.join(", ")}.`,
    );
  }

  return { url: url as string, key: key as string };
}

/** Namespace público lido pelo Vite (também disponível no SSR como fallback). */
export function readPublicSupabaseEnv(): EnvRecord {
  return {
    [PUBLIC_SUPABASE_URL_KEY]: import.meta.env.VITE_APP_SUPABASE_URL,
    [PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY]: import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** Conveniência para o servidor: `APP_*` com fallback para o namespace público. */
export function resolveServerSupabasePublicConfig(
  serverEnv: EnvRecord = process.env,
  publicEnv: EnvRecord = readPublicSupabaseEnv(),
): SupabasePublicConfig {
  return resolveSupabasePublicConfig(serverEnv, publicEnv);
}
