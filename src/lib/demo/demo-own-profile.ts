import { useEffect, useState } from "react";
import { currentUser } from "@/lib/mock-data";
import { PROFILE_MIN_INTERESTS } from "@/lib/profile/profile-rules";
import { demoStorageKey } from "./demo-config";
import { getDemoIdentity } from "./demo-identity";

export type DemoOwnProfile = {
  name: string;
  handle: string;
  photo: string;
  cover: string;
  city: string;
  bio: string;
  interests: string[];
  privateAddresses: {
    home: string;
    work: string;
  };
  visibility: {
    confirmedActivity: ProfileVisibility;
    likedPlaces: ProfileVisibility;
    mutualFriends: ProfileVisibility;
  };
  /** Idade derivada da data de nascimento do onboarding, quando existir. */
  age?: number | null;
  /** Data de nascimento coletada no onboarding (YYYY-MM-DD), quando existir. */
  birthDate?: string;
  /** Identidade demo à qual este perfil está associado. */
  identityId?: string;
};

export type ProfileVisibility = "Todos" | "Conexões" | "Somente você";

export type DemoOnboardingProfileInput = {
  name: string;
  handle: string;
  bio?: string;
  birthDate?: string;
  photo?: string;
};

export type CanonicalDemoProfile = {
  identityId: string;
  profile: DemoOwnProfile;
};

const PROFILE_KEY = demoStorageKey("own-profile");
const PROFILE_EVENT = "connexy:demo:own-profile";
const PROFILE_SAVE_ERROR = "Não foi possível salvar seu perfil. Tente novamente.";

function defaults(): DemoOwnProfile {
  return {
    name: currentUser.name,
    handle: currentUser.handle,
    photo: currentUser.photo,
    cover: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200",
    city: currentUser.city,
    bio: currentUser.bio,
    interests: [...currentUser.interests],
    privateAddresses: { home: "", work: "" },
    visibility: {
      confirmedActivity: "Conexões",
      likedPlaces: "Conexões",
      mutualFriends: "Todos",
    },
  };
}

export function demoOwnProfileStorageKey(): string {
  return PROFILE_KEY;
}

export function hasStoredDemoOwnProfile(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PROFILE_KEY) != null;
  } catch {
    return false;
  }
}

export function uniqueInterests(interests: string[]): string[] {
  const seen = new Set<string>();
  return interests
    .map((interest) => interest.trim())
    .filter((interest) => {
      if (!interest) return false;
      const normalized = interest.toLocaleLowerCase("pt-BR");
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export function ageFromBirthDate(value: string): number | null {
  if (!value) return null;
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

function normalizeStoredProfile(saved: Partial<DemoOwnProfile>): DemoOwnProfile {
  const base = defaults();
  const next: DemoOwnProfile = {
    ...base,
    ...saved,
    interests: Array.isArray(saved.interests) ? uniqueInterests(saved.interests) : base.interests,
    privateAddresses: { ...base.privateAddresses, ...saved.privateAddresses },
    visibility: { ...base.visibility, ...saved.visibility },
  };

  if (typeof saved.identityId === "string" && saved.identityId.trim()) {
    next.identityId = saved.identityId.trim();
  } else {
    delete next.identityId;
  }

  if (typeof saved.birthDate === "string" && saved.birthDate.trim()) {
    next.birthDate = saved.birthDate.trim();
  } else {
    delete next.birthDate;
  }

  if (typeof saved.age === "number" && Number.isFinite(saved.age)) {
    next.age = saved.age;
  } else if (saved.age === null) {
    next.age = null;
  } else if (next.birthDate) {
    next.age = ageFromBirthDate(next.birthDate);
  } else {
    delete next.age;
  }

  return next;
}

export function getDemoOwnProfile(): DemoOwnProfile {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaults();
    const saved = JSON.parse(raw) as Partial<DemoOwnProfile>;
    return normalizeStoredProfile(saved);
  } catch {
    return defaults();
  }
}

export function saveDemoOwnProfile(profile: DemoOwnProfile): void {
  if (typeof window === "undefined") {
    throw new Error(PROFILE_SAVE_ERROR);
  }
  const identityId = profile.identityId?.trim() || getDemoIdentity().id;
  const toSave: DemoOwnProfile = { ...profile, identityId };
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(toSave));
  } catch {
    throw new Error(PROFILE_SAVE_ERROR);
  }
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT));
}

function persistMergedProfile(profile: DemoOwnProfile): DemoOwnProfile {
  saveDemoOwnProfile(profile);
  return getDemoOwnProfile();
}

/** Home, Perfil e Social consultam o mesmo par identidade + perfil. */
export function getCanonicalDemoProfile(): CanonicalDemoProfile {
  const identity = getDemoIdentity();
  const profile = getDemoOwnProfile();
  return {
    identityId: identity.id,
    profile,
  };
}

export function applyDemoOnboardingProfile(input: DemoOnboardingProfileInput): DemoOwnProfile {
  const name = input.name.trim();
  const handle = input.handle.trim().replace(/^@/, "").replace(/\s/g, "").toLowerCase();
  if (!name || !handle) {
    throw new Error("Preencha nome e nome de usuário.");
  }

  const birthDate = input.birthDate?.trim() ?? "";
  const age = ageFromBirthDate(birthDate);
  if (!birthDate || age == null) {
    throw new Error("Informe uma data de nascimento válida.");
  }

  const current = hasStoredDemoOwnProfile()
    ? getDemoOwnProfile()
    : { ...defaults(), interests: [] };
  const identity = getDemoIdentity();
  const next: DemoOwnProfile = {
    ...current,
    name,
    handle,
    bio: input.bio?.trim() ?? current.bio,
    birthDate,
    age,
    identityId: identity.id,
  };
  if (input.photo) next.photo = input.photo;
  return persistMergedProfile(next);
}

export function applyDemoOnboardingInterests(interests: string[]): DemoOwnProfile {
  const unique = uniqueInterests(interests);
  if (unique.length < PROFILE_MIN_INTERESTS) {
    throw new Error("Selecione 3 ou mais interesses.");
  }

  const current = getDemoOwnProfile();
  const identity = getDemoIdentity();
  return persistMergedProfile({
    ...current,
    interests: unique,
    identityId: current.identityId ?? identity.id,
  });
}

export function fileToPersistedPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result) {
        reject(new Error("Não foi possível processar a foto. Tente novamente."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error("Não foi possível processar a foto. Tente novamente."));
    };
    reader.readAsDataURL(file);
  });
}

export function useDemoOwnProfile(): DemoOwnProfile {
  const [profile, setProfile] = useState<DemoOwnProfile>(getDemoOwnProfile);
  useEffect(() => {
    const refresh = () => setProfile(getDemoOwnProfile());
    window.addEventListener(PROFILE_EVENT, refresh);
    refresh();
    return () => window.removeEventListener(PROFILE_EVENT, refresh);
  }, []);
  return profile;
}
