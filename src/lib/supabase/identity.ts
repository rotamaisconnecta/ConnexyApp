import { isSupabaseConfigured } from "./config";

/**
 * Resolves the authenticated user id on the server for the current request.
 *
 * Uses `getClaims()` as the primary source of identity: it loads the session
 * (refreshing it if near expiry, writing refreshed cookies via `setAll`) and
 * verifies the access-token JWT signature. Returns `null` when there is no
 * valid session. Fail-closed: any error or missing claim resolves to `null`.
 */
export async function resolveAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const { createServerSupabaseClient } = await import("./server.server");
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}
