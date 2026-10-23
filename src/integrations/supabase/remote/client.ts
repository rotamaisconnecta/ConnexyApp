import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SchemaADatabase } from "../schema-a-database";
import { RemoteErrorCode, RemoteRepositoryError } from "./errors";

export type { SchemaADatabase };
export type SchemaAClient = SupabaseClient<SchemaADatabase>;

export type SchemaAClientOptions = {
  persistSession?: boolean;
  accessToken?: string;
};

function isOpaqueSupabaseApiKey(value: string): boolean {
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

    // Opaque API keys are sent in `apikey`, not as JWT bearer tokens.
    if (
      isOpaqueSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/** Typed Schema A client. Call explicitly — never from UI demo effects. */
export function createSchemaAClient(
  url: string,
  key: string,
  options: SchemaAClientOptions = {},
): SchemaAClient {
  if (!url.trim() || !key.trim()) {
    throw new RemoteRepositoryError(
      "Schema A client requires url and key",
      RemoteErrorCode.VALIDATION,
    );
  }
  return createClient<SchemaADatabase>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      ...(options.accessToken
        ? { headers: { Authorization: `Bearer ${options.accessToken}` } }
        : {}),
    },
    auth: {
      persistSession: options.persistSession === true,
      autoRefreshToken: options.persistSession === true,
      detectSessionInUrl: false,
    },
  });
}

export async function requireAuthUserId(client: SchemaAClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw new RemoteRepositoryError(error.message, RemoteErrorCode.AUTH);
  }
  const id = data.user?.id;
  if (!id) {
    throw new RemoteRepositoryError("Not authenticated", RemoteErrorCode.AUTH, 401);
  }
  return id;
}
