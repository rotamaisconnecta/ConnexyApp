/*
 * Demo mode configuration.
 *
 * Demo mode is an explicit, local-only execution mode used to let the owner
 * browse every screen and flow without Supabase, without real authentication
 * and without a database. It is activated ONLY by:
 *
 *   VITE_APP_DEMO_MODE=true
 *
 * and NEVER by public variables in production. `import.meta.env.DEV` is
 * statically replaced to `false` on production builds, so even if the env
 * flag is set at build time the demo mode is impossible in production —
 * the app stays fail-closed.
 *
 * All demo state lives under the `connexy:demo:` localStorage namespace and
 * is never mixed with production data or code paths.
 */
export const DEMO_STORAGE_PREFIX = "connexy:demo:";

export const DEMO_MODE_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_APP_DEMO_MODE === "true";

/** Returns true only when the app runs in development AND demo mode is on. */
export function isDemoMode(): boolean {
  return DEMO_MODE_ENABLED;
}

export function demoStorageKey(key: string): string {
  return `${DEMO_STORAGE_PREFIX}${key}`;
}
