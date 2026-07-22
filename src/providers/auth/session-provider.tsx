import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthService } from '@/services/auth-service';

interface SessionContextValue {
  session: unknown;
  refreshSession: () => Promise<void>;
  isExpired: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<unknown>(null);
  const [isExpired, setIsExpired] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const refreshed = await AuthService.refreshSession();
      setSession(refreshed);
      setIsExpired(false);
    } catch {
      setSession(null);
      setIsExpired(true);
    }
  }, []);

  useEffect(() => {
    const checkAndRefresh = async () => {
      if (typeof session === 'object' && session !== null && 'expires_at' in session) {
        const expiresAt = (session as { expires_at: number }).expires_at;
        const now = Math.floor(Date.now() / 1000);
        const bufferSeconds = 60;
        if (expiresAt - now < bufferSeconds) {
          await refreshSession();
        }
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 30000);
    return () => clearInterval(interval);
  }, [session, refreshSession]);

  const value: SessionContextValue = {
    session,
    refreshSession,
    isExpired,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
