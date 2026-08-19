import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";
import { AUTH_COOKIE_NAME, BASE_COOKIE_OPTIONS } from "./constants";

/**
 * Project-owned Supabase browser client.
 *
 * Points exclusively at the user's EXTERNAL Supabase project via
 * `VITE_APP_SUPABASE_URL` / `VITE_APP_SUPABASE_PUBLISHABLE_KEY`. There is no
 * fallback to the Lovable-managed backend (VITE_SUPABASE_* / SUPABASE_*): those
 * env vars are intentionally never read here.
 *
 * The generated client in `@/integrations/supabase/client` is left untouched
 * (it is auto-generated and locked) but has no live importers, so it becomes
 * dead code.
 */
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs. Strip the
    // Authorization: Bearer <key> header the SDK adds and send apikey instead,
    // avoiding "Expected 3 parts in JWT" errors.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createExternalSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_APP_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["VITE_APP_SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["VITE_APP_SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing external Supabase environment variable(s): ${missing.join(", ")}. Set them as project secrets to use your own Supabase project.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    cookieOptions: {
      name: AUTH_COOKIE_NAME,
      ...BASE_COOKIE_OPTIONS,
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      experimental: {
        appendPkceFlowIdToRedirects: true,
      },
    },
  });
}

let _supabase: ReturnType<typeof createExternalSupabaseClient> | undefined;

// Loosely-typed export: the repository layer targets tables that are not part
// of the generated database types yet, so it opts out of strict table typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient<any, "public", any>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createExternalSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
