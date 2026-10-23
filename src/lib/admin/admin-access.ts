import { createServerFn } from "@tanstack/react-start";
import { isDemoMode } from "@/lib/demo/demo-config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AdminAccess =
  | { authorized: true; mode: "demo-preview" | "verified-admin" }
  | { authorized: false; mode: "denied" };

/** Only the current Auth user's protected app_metadata grants real admin access. */
export function hasGlobalAdminClaim(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  const appMetadata = (user as Record<string, unknown>).app_metadata;
  return Boolean(
    appMetadata &&
      typeof appMetadata === "object" &&
      (appMetadata as Record<string, unknown>).platform_role === "admin",
  );
}

/**
 * Server-side route gate. Local demo mode exposes only browser-local preview
 * data; real sessions require the current, server-verified Auth user.
 */
export const getPlatformAdminAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAccess> => {
    if (import.meta.env.DEV && isDemoMode()) {
      return { authorized: true, mode: "demo-preview" };
    }
    if (!isSupabaseConfigured()) return { authorized: false, mode: "denied" };

    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase/server.server");
      const supabase = await createServerSupabaseClient();
      // getUser() queries Auth on each call, so app_metadata revocation does
      // not wait for an old access token's claims to expire or refresh.
      const { data, error } = await supabase.auth.getUser();
      if (error || !hasGlobalAdminClaim(data?.user)) {
        return { authorized: false, mode: "denied" };
      }
      return { authorized: true, mode: "verified-admin" };
    } catch {
      return { authorized: false, mode: "denied" };
    }
  },
);
