// Project-owned configuration check. Reads only the external-Supabase env
// namespace (VITE_APP_* for the browser, APP_* for the server). There is no
// fallback to the Lovable-managed backend (VITE_SUPABASE_* / SUPABASE_*).
export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_APP_SUPABASE_URL &&
      import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  if (isPublicSupabaseConfigured()) return true;
  if (typeof window !== "undefined") return false;
  return Boolean(
    process.env.APP_SUPABASE_URL && process.env.APP_SUPABASE_PUBLISHABLE_KEY,
  );
}
