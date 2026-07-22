import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface PresenceContextValue {
  onlineUsers: Set<string>;
  trackPresence: (userId: string) => void;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>['channel']
  > | null>(null);

  useEffect(() => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );

    const channel = supabase.channel('online-users', {
      config: {
        presence: { key: 'online-users' },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, { user_id: string }[]>;
        const userIds = new Set<string>();
        for (const presences of Object.values(state)) {
          for (const presence of presences) {
            if (presence.user_id) {
              userIds.add(presence.user_id);
            }
          }
        }
        setOnlineUsers(userIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: 'current' });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const trackPresence = useCallback((userId: string) => {
    if (channelRef.current) {
      channelRef.current.track({ user_id: userId });
    }
  }, []);

  const isOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers],
  );

  const value: PresenceContextValue = {
    onlineUsers,
    trackPresence,
    isOnline,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
}
