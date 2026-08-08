import type { Session } from "@supabase/supabase-js";
import { SESSION_COOKIE_NAME } from "./server-auth";

const COOKIE_OPTIONS = "; Path=/; SameSite=Lax; Max-Age=604800";

/**
 * Mirrors the Supabase session into a JS-readable cookie so the SSR layer can
 * authenticate per request (the Supabase browser client persists to
 * localStorage, which the server cannot see). Security trade-off: the access
 * token becomes readable by client JS — the same trust boundary as
 * localStorage. Production hardening (httpOnly cookie set by a server route)
 * is documented in the audit report.
 */
export function syncSessionCookie(session: Session | null): void {
  if (typeof document === "undefined") return;
  if (session?.access_token) {
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(session.access_token)}${COOKIE_OPTIONS}`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`;
  }
}
