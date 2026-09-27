/**
 * Shared profile-completion rules. Kept free of router/server dependencies so
 * local persistence and browser fixtures can validate the same contract.
 */
export const PROFILE_MIN_INTERESTS = 3;

export type ProfileStep = "completar-perfil" | "interesses" | null;

export interface ProfileEssentials {
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
