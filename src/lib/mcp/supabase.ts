import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

// External Supabase only — the APP_* namespace. No fallback to the
// Lovable-managed backend (SUPABASE_* / VITE_SUPABASE_*).
function supabaseProjectUrl(): string {
  const url = configuredEnv(["APP_SUPABASE_URL", "VITE_APP_SUPABASE_URL"]);
  if (!url) throw new Error("APP_SUPABASE_URL (or VITE_APP_SUPABASE_URL) is required");
  return url;
}

function supabasePublishableKey(): string {
  const direct = configuredEnv([
    "APP_SUPABASE_PUBLISHABLE_KEY",
    "VITE_APP_SUPABASE_PUBLISHABLE_KEY",
  ]);
  if (direct) return direct;
  const keyset = runtimeEnv("APP_SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      // Malformed dictionary; fall through to the legacy names below.
    }
  }
  const legacy = configuredEnv(["APP_SUPABASE_ANON_KEY", "VITE_APP_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error(
    "APP_SUPABASE_PUBLISHABLE_KEY, APP_SUPABASE_PUBLISHABLE_KEYS, or APP_SUPABASE_ANON_KEY is required",
  );
}

/** Forwards the verified bearer token so RLS runs as the signed-in user. */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser requires a verified OAuth token");
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function notAuthenticated() {
  return {
    content: [{ type: "text" as const, text: "Not authenticated. Connect your Connexy account." }],
    isError: true,
  };
}
