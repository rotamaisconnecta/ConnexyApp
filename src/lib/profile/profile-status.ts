import { createServerFn } from "@tanstack/react-start";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveAuthenticatedUserId } from "@/lib/supabase/identity";
import { isDemoMode } from "@/lib/demo/demo-config";
import { isDemoAuthenticated, isDemoSignupPending } from "@/lib/demo/demo-auth";

/**
 * A profile is considered complete when the user has a name, a handle and at
 * least PROFILE_MIN_INTERESTS interests. Photo is optional — the avatars
 * bucket exists but absence of a photo must not trigger an onboarding loop.
 */
export const PROFILE_MIN_INTERESTS = 3;

export type ProfileStep = "completar-perfil" | "interesses" | null;

export interface ProfileCompletion {
  authenticated: boolean;
  hasProfile: boolean;
  complete: boolean;
  step: ProfileStep;
}

export const INCOMPLETE_PROFILE: ProfileCompletion = {
  authenticated: false,
  hasProfile: false,
  complete: false,
  step: null,
};

interface ProfileEssentials {
  name: string | null;
  handle: string | null;
  age: number | null;
  interests: string[];
}

export function computeProfileStep(profile: ProfileEssentials | null): {
  hasProfile: boolean;
  complete: boolean;
  step: ProfileStep;
} {
  if (!profile) return { hasProfile: false, complete: false, step: "completar-perfil" };
  const { name, handle, age, interests } = profile;
  if (!name || !handle || age == null) {
    return { hasProfile: true, complete: false, step: "completar-perfil" };
  }
  if ((interests ?? []).length < PROFILE_MIN_INTERESTS) {
    return { hasProfile: true, complete: false, step: "interesses" };
  }
  return { hasProfile: true, complete: true, step: null };
}

async function resolveServerStatus(): Promise<ProfileCompletion | null> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) return null;

  const { createServerSupabaseClient } = await import("@/lib/supabase/server.server");
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("profiles")
    .select("name, handle, age, interests")
    .eq("id", userId)
    .maybeSingle();

  const step = computeProfileStep((data as ProfileEssentials | null) ?? null);
  return {
    authenticated: true,
    hasProfile: step.hasProfile,
    complete: step.complete,
    step: step.step,
  };
}

/**
 * Demo-mode status: the simulated profile has no remote backing. It is treated
 * as complete the moment a demo session exists, unless the user explicitly
 * started the local onboarding (pending signup) — in which case the guards
 * keep them in the "Complete seu perfil" flow instead of bouncing to Home.
 * Absence of remote data is never interpreted as an incomplete profile here.
 */
function demoProfileStatus(): ProfileCompletion {
  if (!isDemoAuthenticated()) return INCOMPLETE_PROFILE;
  if (isDemoSignupPending()) {
    return { authenticated: true, hasProfile: false, complete: false, step: "completar-perfil" };
  }
  return { authenticated: true, hasProfile: true, complete: true, step: null };
}

/**
 * Server-side status resolution used by route guards, sign-in/sign-up
 * redirects and the client server-function. Returns INCOMPLETE_PROFILE when
 * Supabase is not configured (dev-mock) or when there is no valid session.
 */
export async function getProfileStatus(): Promise<ProfileCompletion> {
  if (isDemoMode()) return demoProfileStatus();
  if (!isSupabaseConfigured()) return INCOMPLETE_PROFILE;
  const status = await resolveServerStatus();
  if (!status) return INCOMPLETE_PROFILE;
  return status;
}

export const getProfileStatusClient = createServerFn({ method: "GET" }).handler(async () =>
  getProfileStatus(),
);

/**
 * Browser-side guards must ask the server for the verified status. During SSR
 * it resolves directly on the request's session, mirroring `requireAuth`.
 *
 * Demo mode is local-only: session and pending-signup flags live in the
 * browser's localStorage, so the guard resolves them directly instead of
 * round-tripping a server function that cannot see that state.
 */
export async function profileCompletionForGuard(): Promise<ProfileCompletion> {
  if (isDemoMode()) {
    // Demo state (session + pending signup) lives in the browser. SSR cannot
    // see it and must stay permissive; the client re-evaluates after hydrate.
    if (import.meta.env.SSR) return INCOMPLETE_PROFILE;
    return demoProfileStatus();
  }
  if (import.meta.env.SSR) return getProfileStatus();
  try {
    return await getProfileStatusClient();
  } catch {
    return INCOMPLETE_PROFILE;
  }
}

export type OnboardingGuardDecision = { allowed: true } | { allowed: false; to: "/home" | "/auth" };

/**
 * beforeLoad decision for the onboarding screens ("Complete seu perfil" and
 * "Interesses").
 *
 * - Demo mode: only reachable after the user explicitly started the local
 *   signup. No session → /auth; no pending signup → /home (profile complete).
 * - Real mode: keeps the existing protection — home once complete, otherwise
 *   the onboarding screen stays reachable.
 */
export async function profileOnboardingForGuard(): Promise<OnboardingGuardDecision> {
  if (isDemoMode()) {
    if (import.meta.env.SSR) return { allowed: true };
    const status = await profileCompletionForGuard();
    if (!status.authenticated) return { allowed: false, to: "/auth" };
    if (!status.complete) return { allowed: true };
    return { allowed: false, to: "/home" };
  }
  const status = await profileCompletionForGuard();
  if (status.authenticated && status.complete) return { allowed: false, to: "/home" };
  return { allowed: true };
}
