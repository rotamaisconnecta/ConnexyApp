import { useCallback, useState } from "react";
import { PresenceService } from "@/services/presence.service";
import type { PresencePreference } from "@/types/phase-13b";

const STORAGE_KEY = "connexy.presence.preference";

function loadStoredPreference(): PresencePreference {
  if (typeof window === "undefined") return "online";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "online" || raw === "available" || raw === "dnd" || raw === "invisible") return raw;
  } catch {
    // storage unavailable, use default
  }
  return "online";
}

function storePreference(pref: PresencePreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // storage unavailable, silently ignore
  }
}

export function useUserPresenceControl(userId: string | null) {
  const [preference, setPreferenceState] = useState<PresencePreference>(loadStoredPreference);

  const setPreference = useCallback(
    async (next: PresencePreference) => {
      setPreferenceState(next);
      storePreference(next);
      if (!userId) return;
      try {
        await PresenceService.publish(userId, next);
      } catch {
        // presence publish failed silently
      }
    },
    [userId],
  );

  const goOnline = useCallback(() => setPreference("online"), [setPreference]);
  const goAvailable = useCallback(() => setPreference("available"), [setPreference]);
  const goDnd = useCallback(() => setPreference("dnd"), [setPreference]);
  const goInvisible = useCallback(() => setPreference("invisible"), [setPreference]);

  return { preference, setPreference, goOnline, goAvailable, goDnd, goInvisible };
}
