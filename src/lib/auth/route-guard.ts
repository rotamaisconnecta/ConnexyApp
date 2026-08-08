import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeReturnTo } from "./return-to";
import { isSupabaseConfigured, resolveRequestUser } from "./server-auth";

type RequireAuthContext = {
  location: { href: string };
};

/**
 * Route guard (beforeLoad-compatible) that enforces SSR auth only when
 * Supabase is configured. In dev/demo (no credentials) it is a no-op.
 *
 * - Server: validates the session per request via a fresh Supabase client
 *   using the session cookie (or Authorization bearer) — never trusts
 *   localStorage/claims.
 * - Client: validates the hydrated session from the browser Supabase client.
 *
 * Unauthenticated requests are redirected to `/auth` with an internal-only
 * `returnTo`. The redirect target is sanitized to prevent open redirects.
 */
export async function requireAuth({ location }: RequireAuthContext) {
  if (!isSupabaseConfigured()) return;

  let authenticated = false;
  if (import.meta.env.SSR) {
    authenticated = (await resolveRequestUser()) !== null;
  } else {
    const { data } = await supabase.auth.getSession();
    authenticated = Boolean(data.session);
  }

  if (authenticated) return;

  throw redirect({
    to: "/auth",
    search: { returnTo: sanitizeReturnTo(location.href) },
    replace: true,
  });
}
