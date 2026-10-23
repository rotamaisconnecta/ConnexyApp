/*
 * Demo mode configuration.
 *
 * Demo mode is an explicit, local-only execution mode used to let the owner
 * browse every screen and flow without Supabase, without real authentication
 * and without a database.
 *
 * Canonical flag: VITE_CONNEXY_DEMO=true
 * Legacy alias:   VITE_APP_DEMO_MODE=true  (same gate — not a second system)
 *
 * Activated ONLY when:
 *   import.meta.env.DEV === true && <flag> === "true"
 *
 * `import.meta.env.DEV` is statically replaced to `false` on production and
 * preview builds, so the flag cannot enable demo outside Vite DEV.
 *
 * All demo state lives under the `connexy:demo:` localStorage namespace and
 * is never mixed with production data or code paths.
 */
export const DEMO_STORAGE_PREFIX = "connexy:demo:";

/** Evento window disparado quando o estado demo (incl. chat local) muda. */
export const DEMO_DB_EVENT = "connexy:demo:db";

export type DemoEnvFlags = {
  DEV?: boolean;
  VITE_CONNEXY_DEMO?: string;
  VITE_APP_DEMO_MODE?: string;
};

/** Pure gate used by the app and by tests. Preview/produção: DEV !== true. */
export function computeDemoEnabled(env: DemoEnvFlags): boolean {
  if (env.DEV !== true) return false;
  return env.VITE_CONNEXY_DEMO === "true" || env.VITE_APP_DEMO_MODE === "true";
}

export const DEMO_MODE_ENABLED = computeDemoEnabled({
  DEV: import.meta.env.DEV === true,
  VITE_CONNEXY_DEMO: import.meta.env.VITE_CONNEXY_DEMO,
  VITE_APP_DEMO_MODE: import.meta.env.VITE_APP_DEMO_MODE,
});

/** Alias canônico da matriz DEV + VITE_CONNEXY_DEMO. */
export const DEMO_ENABLED = DEMO_MODE_ENABLED;

let demoEnabledForTests: boolean | null = null;

/** Test-only. Not a runtime activation path for the app. */
export function setDemoEnabledForTests(value: boolean | null): void {
  demoEnabledForTests = value;
}

/** Returns true only when the app runs in development AND demo mode is on. */
export function isDemoMode(): boolean {
  if (demoEnabledForTests != null) return demoEnabledForTests;
  return DEMO_MODE_ENABLED;
}

export function demoStorageKey(key: string): string {
  return `${DEMO_STORAGE_PREFIX}${key}`;
}
