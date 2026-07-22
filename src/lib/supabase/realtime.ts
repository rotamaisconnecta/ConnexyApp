import { supabase } from "@/integrations/supabase/client";

type Channel = ReturnType<typeof supabase.channel>;

export const RealtimeHelper = {
  subscribeChannel(
    channel: string,
    table: string,
    filter?: string,
    callback?: (payload: unknown) => void,
  ) {
    return supabase
      .channel(channel)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => callback?.(payload),
      )
      .subscribe();
  },

  removeChannel(channel: Channel) {
    return supabase.removeChannel(channel);
  },

  subscribePresence(channel: string) {
    return supabase.channel(channel).on("presence", { event: "sync" }, () => {}).subscribe();
  },

  trackPresence(channel: Channel, key: string, state: Record<string, unknown>) {
    return channel.track({ key, ...state });
  },
};
