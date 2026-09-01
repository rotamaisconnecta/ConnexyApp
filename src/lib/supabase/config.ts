import { isDemoMode } from "@/lib/demo/demo-config";

// Project-owned configuration check. Reads only the external-Supabase env
// namespace (VITE_APP_* for the browser, APP_* for the server). There is no
// fallback to the Lovable-managed backend (VITE_SUPABASE_* / SUPABASE_*).
//
// In demo mode (DEV only) Supabase is treated as unconfigured: the app then
// routes every screen through its local fallbacks and never instantiates or
// queries Supabase. `isDemoMode()` is statically false on production builds,
// so this can never disable the real backend in production (fail-closed).
export function isPublicSupabaseConfigured(): boolean {
  if (isDemoMode()) return false;
  return Boolean(
    import.meta.env.VITE_APP_SUPABASE_URL && import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  if (isDemoMode()) return false;
  if (isPublicSupabaseConfigured()) return true;
  if (typeof window !== "undefined") return false;
  return Boolean(process.env.APP_SUPABASE_URL && process.env.APP_SUPABASE_PUBLISHABLE_KEY);
}
