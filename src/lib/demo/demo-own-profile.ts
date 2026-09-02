import { useEffect, useState } from "react";
import { currentUser } from "@/lib/mock-data";
import { demoStorageKey } from "./demo-config";

export type DemoOwnProfile = {
  name: string;
  handle: string;
  photo: string;
  city: string;
  bio: string;
  interests: string[];
};

const PROFILE_KEY = demoStorageKey("own-profile");
const PROFILE_EVENT = "connexy:demo:own-profile";

function defaults(): DemoOwnProfile {
  return { name: currentUser.name, handle: currentUser.handle, photo: currentUser.photo, city: currentUser.city, bio: currentUser.bio, interests: [...currentUser.interests] };
}

export function getDemoOwnProfile(): DemoOwnProfile {
  if (typeof window === "undefined") return defaults();
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? "{}") as Partial<DemoOwnProfile>;
    const base = defaults();
    return { ...base, ...saved, interests: Array.isArray(saved.interests) ? saved.interests : base.interests };
  } catch { return defaults(); }
}

export function saveDemoOwnProfile(profile: DemoOwnProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT));
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
