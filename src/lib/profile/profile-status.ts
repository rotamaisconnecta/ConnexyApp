import { createServerFn } from "@tanstack/react-start";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveAuthenticatedUserId } from "@/lib/supabase/identity";

/**
 * A profile is considered complete when the user has a name, a handle and at
 * least PROFILE_MIN_INTERESTS interests. Photo is intentionally not required
 * (there is no avatars bucket in this environment).
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
 * Server-side status resolution used by route guards, sign-in/sign-up
 * redirects and the client server-function. Returns INCOMPLETE_PROFILE when
 * Supabase is not configured (dev-mock) or when there is no valid session.
 */
export async function getProfileStatus(): Promise<ProfileCompletion> {
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
 */
export async function profileCompletionForGuard(): Promise<ProfileCompletion> {
  if (import.meta.env.SSR) return getProfileStatus();
  try {
    return await getProfileStatusClient();
  } catch {
    return INCOMPLETE_PROFILE;
  }
}
