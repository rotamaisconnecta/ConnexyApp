export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  if (isPublicSupabaseConfigured()) return true;
  if (typeof window !== "undefined") return false;
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
