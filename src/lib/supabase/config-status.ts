/**
 * Checks whether the backend connection settings are available, without ever
 * instantiating the client (which throws when they are missing).
 */
export function isBackendConfigured(): boolean {
  const env = import.meta.env as Record<string, string | undefined>;
  const serverEnv =
    typeof process !== "undefined" && process.env
      ? (process.env as Record<string, string | undefined>)
      : {};

  const url = env.VITE_SUPABASE_URL || serverEnv.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || serverEnv.SUPABASE_PUBLISHABLE_KEY;

  return Boolean(url && key);
}

export function isBackendConfigError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("Missing Supabase environment variable(s)")
  );
}
