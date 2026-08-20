import { createContext, useCallback, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useConnectionPresence } from "@/hooks/use-connection-presence";
import { PresenceService } from "@/services/presence.service";

interface PresenceContextValue {
  onlineUsers: Set<string>;
  trackPresence: (userId: string) => void;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { onlineUsers, isOnline } = useConnectionPresence(user?.id ?? null, "online");
  const trackPresence = useCallback((userId: string) => {
    void PresenceService.publish(userId, "online");
  }, []);

  const value: PresenceContextValue = {
    onlineUsers,
    trackPresence,
    isOnline,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresenceContext must be used within a PresenceProvider");
  }
  return context;
}
