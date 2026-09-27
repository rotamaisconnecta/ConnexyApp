import type { PresencePreference } from "@/types/phase-13b";

export const PRESENCE_PREFERENCE_STORAGE_KEY = "connexy.presence.preference";

const ALLOWED: ReadonlySet<PresencePreference> = new Set([
  "online",
  "available",
  "dnd",
  "invisible",
]);

export function readStoredPresencePreference(): PresencePreference {
  if (typeof window === "undefined") return "invisible";
  try {
    const raw = window.localStorage.getItem(PRESENCE_PREFERENCE_STORAGE_KEY);
    if (raw && ALLOWED.has(raw as PresencePreference)) return raw as PresencePreference;
  } catch {
    // storage unavailable
  }
  return "invisible";
}

export function writeStoredPresencePreference(pref: PresencePreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRESENCE_PREFERENCE_STORAGE_KEY, pref);
  } catch {
    // storage unavailable
  }
}
