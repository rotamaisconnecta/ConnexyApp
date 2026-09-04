import { demoStorageKey } from "./demo-config";

const AUTH_KEY = "authenticated";

/** Whether the local demo session has been "signed in" by the user. */
export function isDemoAuthenticated(): boolean {
  if (typeof window === "undefined") return DEMO_SESSION_STARTED;
  try {
    return window.localStorage.getItem(demoStorageKey(AUTH_KEY)) === "1";
  } catch {
    return false;
  }
}

/** Marks a local demo session as entered. */
export function enterDemoSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(demoStorageKey(AUTH_KEY), "1");
  } catch {
    /* storage unavailable */
  }
}

/** Ends the local demo session (back to the auth screen). */
export function exitDemoSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(demoStorageKey(AUTH_KEY));
  } catch {
    /* storage unavailable */
  }
}

/** SSR-friendly module-level fallback (never used to gate in production). */
const DEMO_SESSION_STARTED = true;
