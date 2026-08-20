import { supabase } from "@/lib/supabase/client";

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
      .on("postgres_changes", { event: "*", schema: "public", table, filter }, (payload) =>
        callback?.(payload),
      )
      .subscribe();
  },

  removeChannel(channel: Channel) {
    return supabase.removeChannel(channel);
  },
};
