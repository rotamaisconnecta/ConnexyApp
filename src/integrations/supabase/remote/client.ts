import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SchemaADatabase } from "../schema-a-database";
import { RemoteErrorCode, RemoteRepositoryError } from "./errors";

export type { SchemaADatabase };
export type SchemaAClient = SupabaseClient<SchemaADatabase>;

export type SchemaAClientOptions = {
  persistSession?: boolean;
  accessToken?: string;
};

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
    auth: {
      persistSession: options.persistSession === true,
      autoRefreshToken: options.persistSession === true,
      detectSessionInUrl: false,
    },
    global: options.accessToken
      ? { headers: { Authorization: `Bearer ${options.accessToken}` } }
      : undefined,
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
