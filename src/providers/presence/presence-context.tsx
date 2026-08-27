import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { PresenceService } from "@/services/presence.service";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import {
  isPresenceFresh,
  PRESENCE_HEARTBEAT_MS,
  type PresencePreference,
  type PresenceStatus,
  type UserPresenceRow,
} from "@/types/phase-13b";

const STORAGE_KEY = "connexy.presence.preference";

function loadStoredPreference(): PresencePreference {
  if (typeof window === "undefined") return "invisible";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "online" || raw === "available" || raw === "dnd" || raw === "invisible") return raw;
  } catch {
    // storage unavailable
  }
  return "invisible";
}

function storePreference(pref: PresencePreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // storage unavailable
  }
}

interface PresenceContextValue {
  preference: PresencePreference;
  goOnline: () => void;
  goAvailable: () => void;
  goDnd: () => void;
  goInvisible: () => void;
  presenceByUser: Map<string, UserPresenceRow>;
  isOnline: (id: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function usePresenceContext(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresenceContext must be used within PresenceProvider");
  return ctx;
}

interface PresenceProviderProps {
  userId: string | null;
  children: React.ReactNode;
}

export function PresenceProvider({ userId, children }: PresenceProviderProps) {
  const [preference, setPreferenceState] = useState<PresencePreference>(loadStoredPreference);
  const [presenceByUser, setPresenceByUser] = useState<Map<string, UserPresenceRow>>(new Map());
  const preferenceRef = useRef(preference);
  const previousPreferenceRef = useRef(preference);
  const channelRef = useRef<ReturnType<typeof PresenceService.subscribe> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);

  preferenceRef.current = preference;

  const setPreference = useCallback((next: PresencePreference) => {
    setPreferenceState(next);
    storePreference(next);
  }, []);

  const goOnline = useCallback(() => setPreference("online"), [setPreference]);
  const goAvailable = useCallback(() => setPreference("available"), [setPreference]);
  const goDnd = useCallback(() => setPreference("dnd"), [setPreference]);
  const goInvisible = useCallback(() => setPreference("invisible"), [setPreference]);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !isPublicSupabaseConfigured()) return;

    let active = true;
    const channel = PresenceService.subscribe((payload) => {
      if (!active) return;
      setPresenceByUser((current) => {
        const next = new Map(current);
        if (payload.eventType === "DELETE") {
          next.delete(payload.old.user_id as string);
        } else {
          const row = payload.new as UserPresenceRow;
          next.set(row.user_id, row);
        }
        return next;
      });
    });
    channelRef.current = channel;

    return () => {
      active = false;
      void PresenceService.unsubscribe(channel);
      channelRef.current = null;
    };
  }, [userId]);

  // Heartbeat
  useEffect(() => {
    if (heartbeatRef.current) {
      globalThis.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (!userId || !isPublicSupabaseConfigured()) return;

    const previousPreference = previousPreferenceRef.current;
    previousPreferenceRef.current = preference;

    if (preference === "invisible") {
      if (previousPreference !== "invisible") {
        // Remove presence only when transitioning into invisible mode.
        void PresenceService.publish(userId, "invisible");
      }
      return;
    }

    const publishIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      void PresenceService.publish(userId, preferenceRef.current);
    };

    publishIfVisible();
    const heartbeat = globalThis.setInterval(publishIfVisible, PRESENCE_HEARTBEAT_MS);
    heartbeatRef.current = heartbeat;

    document.addEventListener("visibilitychange", publishIfVisible);
    return () => {
      globalThis.clearInterval(heartbeat);
      heartbeatRef.current = null;
      document.removeEventListener("visibilitychange", publishIfVisible);
    };
  }, [preference, userId]);

  // Initial load of visible presences
  useEffect(() => {
    if (!userId || !isPublicSupabaseConfigured()) return;
    let active = true;
    void PresenceService.listVisible().then((rows) => {
      if (active) setPresenceByUser(new Map(rows.map((row) => [row.user_id, row])));
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const isOnline = useCallback(
    (id: string) => {
      for (const row of presenceByUser.values()) {
        if (row.user_id === id && isPresenceFresh(row)) return true;
      }
      return false;
    },
    [presenceByUser],
  );

  return (
    <PresenceContext.Provider
      value={{ preference, goOnline, goAvailable, goDnd, goInvisible, presenceByUser, isOnline }}
    >
      {children}
    </PresenceContext.Provider>
  );
}
