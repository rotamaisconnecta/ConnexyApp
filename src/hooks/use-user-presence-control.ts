import { useCallback, useState } from "react";
import { PresenceService } from "@/services/presence.service";
import type { PresencePreference } from "@/types/phase-13b";
import {
  readStoredPresencePreference,
  writeStoredPresencePreference,
} from "@/lib/presence/presence-preference";

export function useUserPresenceControl(userId: string | null) {
  const [preference, setPreferenceState] = useState<PresencePreference>(
    readStoredPresencePreference,
  );

  const setPreference = useCallback(
    async (next: PresencePreference) => {
      setPreferenceState(next);
      writeStoredPresencePreference(next);
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
