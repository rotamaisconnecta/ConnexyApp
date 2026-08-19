export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_APP_SUPABASE_URL && import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  return isPublicSupabaseConfigured();
}
