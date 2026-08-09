import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";
import { AUTH_COOKIE_NAME, BASE_COOKIE_OPTIONS } from "./constants";

function mergeVary(existing: string | undefined, value: string): string {
  if (!existing) return value;
  const parts = existing.split(",").map((part) => part.trim().toLowerCase());
  if (parts.includes(value.trim().toLowerCase())) return existing;
  return `${existing}, ${value}`;
}

/**
 * Creates a Supabase SSR client bound to the current request.
 *
 * Always create a new client per request — never share it across requests or
 * hold it in a module-level singleton.
 *
 * The request runtime helpers are imported lazily so this module stays safe
 * for the client bundle (only reached under `import.meta.env.SSR`).
 */
export async function createServerSupabaseClient() {
  const {
    deleteCookie,
    getCookies,
    getRequestProtocol,
    getResponseHeader,
    setCookie,
    setResponseHeader,
  } = await import("@tanstack/react-start/server");

  const SUPABASE_URL = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY. Connect Supabase in Lovable Cloud.",
    );
  }

  const secure = getRequestProtocol() === "https";

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) {
          if (value) {
            setCookie(name, value, options);
          } else {
            deleteCookie(name, options);
          }
        }
        if (headers) {
          for (const [name, value] of Object.entries(headers)) {
            setResponseHeader(name, value);
          }
        }
        setResponseHeader("Vary", mergeVary(getResponseHeader("Vary"), "Cookie"));
      },
    },
    cookieOptions: {
      name: AUTH_COOKIE_NAME,
      ...BASE_COOKIE_OPTIONS,
      secure,
    },
    auth: {
      experimental: {
        appendPkceFlowIdToRedirects: true,
      },
    },
  });
}
