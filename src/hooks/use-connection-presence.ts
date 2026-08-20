import { useEffect, useMemo, useState } from "react";
import { PresenceService } from "@/services/presence.service";
import {
  isPresenceFresh,
  PRESENCE_HEARTBEAT_MS,
  type PresencePreference,
  type UserPresenceRow,
} from "@/types/phase-13b";

export function useConnectionPresence(userId: string | null, preference: PresencePreference) {
  const [presenceByUser, setPresenceByUser] = useState<Map<string, UserPresenceRow>>(new Map());
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void PresenceService.listVisible().then((rows) => {
      if (active) setPresenceByUser(new Map(rows.map((row) => [row.user_id, row])));
    });

    const channel = PresenceService.subscribe((payload) => {
      if (!active) return;
      setPresenceByUser((current) => {
        const next = new Map(current);
        if (payload.eventType === "DELETE") next.delete(payload.old.user_id as string);
        else {
          const row = payload.new as UserPresenceRow;
          next.set(row.user_id, row);
        }
        return next;
      });
    });
    return () => {
      active = false;
      void PresenceService.unsubscribe(channel);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const publishIfVisible = () => {
      if (preference === "invisible" || document.visibilityState !== "visible") return;
      void PresenceService.publish(userId, preference);
    };
    if (preference === "invisible") void PresenceService.publish(userId, preference);
    else publishIfVisible();
    const heartbeat = window.setInterval(publishIfVisible, PRESENCE_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", publishIfVisible);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", publishIfVisible);
    };
  }, [preference, userId]);

  useEffect(() => {
    const expiry = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(expiry);
  }, []);

  const onlineUsers = useMemo(
    () =>
      new Set(
        [...presenceByUser.values()]
          .filter((row) => isPresenceFresh(row, clock))
          .map((row) => row.user_id),
      ),
    [clock, presenceByUser],
  );

  return { onlineUsers, presenceByUser, isOnline: (id: string) => onlineUsers.has(id) };
}
