import { demoStorageKey } from "./demo-config";

const AUTH_KEY = "authenticated";
const SIGNUP_PENDING_KEY = "signup-pending";

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
  clearDemoSignup();
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(demoStorageKey(AUTH_KEY));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Whether an explicit demo signup is pending. A demo user only reaches the
 * onboarding screens ("Complete seu perfil" / "Interesses") after actually
 * starting the signup; otherwise the simulated profile is treated as complete.
 */
export function isDemoSignupPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(demoStorageKey(SIGNUP_PENDING_KEY)) === "1";
  } catch {
    return false;
  }
}

/** Marks the local demo onboarding as explicitly started (profile pending). */
export function startDemoSignup(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(demoStorageKey(SIGNUP_PENDING_KEY), "1");
  } catch {
    /* storage unavailable */
  }
}

/** Marks the local demo onboarding as finished (profile no longer pending). */
export function clearDemoSignup(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(demoStorageKey(SIGNUP_PENDING_KEY));
  } catch {
    /* storage unavailable */
  }
}

/** SSR-friendly module-level fallback (never used to gate in production). */
const DEMO_SESSION_STARTED = true;
