import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const SESSION_COOKIE_NAME = "connexy-access-token";

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}

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

    // New Supabase API keys are opaque strings, not bearer JWTs.
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

function getServerConfig() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function createServerAuthClient(token: string) {
  const config = getServerConfig();
  if (!config) {
    throw new Error(
      "Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return createClient<Database>(config.url, config.key, {
    global: {
      fetch: createSupabaseFetch(config.key),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  }).auth.getUser(token);
}

export async function resolveRequestUser(): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured()) return null;

  let token: string | undefined;
  try {
    const { getCookie, getRequest } = await import("@tanstack/react-start/server");
    token = getCookie(SESSION_COOKIE_NAME);
    if (!token) {
      const authHeader = getRequest().headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) token = authHeader.slice("Bearer ".length);
    }
  } catch {
    return null;
  }

  if (!token) return null;

  const { data, error } = await createServerAuthClient(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}
