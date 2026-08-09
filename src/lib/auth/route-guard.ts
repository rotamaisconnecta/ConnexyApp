import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveAuthenticatedUserId } from "@/lib/supabase/identity";
import { sanitizeReturnTo } from "./return-to";

type RequireAuthContext = {
  location: { href: string };
};

/**
 * Route guard (beforeLoad-compatible) that enforces SSR auth only when
 * Supabase is configured. In dev/demo (no credentials) it is a no-op.
 *
 * - Server: resolves identity per request via the SSR client and verified JWT
 *   claims (`getClaims`) — never trusts localStorage or the cookie's raw value.
 * - Client: validates the hydrated session from the browser Supabase client.
 *
 * Unauthenticated requests are redirected to `/auth` with an internal-only
 * `returnTo`. The redirect target is sanitized to prevent open redirects.
 */
export async function requireAuth({ location }: RequireAuthContext) {
  if (!isSupabaseConfigured()) {
    // Demo/development without Supabase credentials keeps the mock flow intact.
    // Production must fail closed: missing config cannot silently open protected routes.
    if (import.meta.env.DEV) return;
    throw new Error(
      "Authentication is not configured. Missing SUPABASE_URL and/or SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  let authenticated = false;
  if (import.meta.env.SSR) {
    authenticated = (await resolveAuthenticatedUserId()) !== null;
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
