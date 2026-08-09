import { redirect } from "@tanstack/react-router";
import { isPublicSupabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { getAuthenticatedUserId, resolveAuthenticatedUserId } from "@/lib/supabase/identity";
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
 * - Client: asks a server function for the verified per-request identity.
 *
 * Unauthenticated requests are redirected to `/auth` with an internal-only
 * `returnTo`. The redirect target is sanitized to prevent open redirects.
 */
export async function requireAuth({ location }: RequireAuthContext) {
  // The browser cannot authenticate without the public VITE_* variables. In
  // development only, keep the existing local mock flow available instead.
  if (import.meta.env.DEV && !isPublicSupabaseConfigured()) return;

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
    const { userId } = await getAuthenticatedUserId();
    authenticated = typeof userId === "string" && userId.length > 0;
  }

  if (authenticated) return;

  throw redirect({
    to: "/auth",
    search: { returnTo: sanitizeReturnTo(location.href) },
    replace: true,
  });
}
