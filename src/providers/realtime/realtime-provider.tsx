import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface RealtimeContextValue {
  subscribe: (channel: string, callback: (payload: unknown) => void) => void;
  unsubscribe: (channel: string) => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<Map<string, ReturnType<typeof createClient.prototype.channel>>>(
    new Map(),
  );
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );
    supabaseRef.current = supabase;

    const channel = supabase.channel('realtime-connection');
    channel
      .on('system' as never, { event: 'connected' } as never, () => setIsConnected(true))
      .on('system' as never, { event: 'disconnected' } as never, () => setIsConnected(false))
      .subscribe();

    return () => {
      channelsRef.current.forEach((ch) => {
        supabase.removeChannel(ch);
      });
      channelsRef.current.clear();
      supabase.removeChannel(channel);
    };
  }, []);

  const subscribe = useCallback(
    (channelName: string, callback: (payload: unknown) => void) => {
      if (!supabaseRef.current) return;
      const channel = supabaseRef.current
        .channel(channelName)
        .on('broadcast' as never, { event: 'message' } as never, (payload) => {
          callback(payload);
        })
        .subscribe();
      channelsRef.current.set(channelName, channel);
    },
    [],
  );

  const unsubscribe = useCallback((channelName: string) => {
    const channel = channelsRef.current.get(channelName);
    if (channel && supabaseRef.current) {
      supabaseRef.current.removeChannel(channel);
      channelsRef.current.delete(channelName);
    }
  }, []);

  const value: RealtimeContextValue = {
    subscribe,
    unsubscribe,
    isConnected,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}
