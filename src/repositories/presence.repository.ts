import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { PresenceStatus, UserPresenceRow } from "@/types/phase-13b";

export const PresenceRepository = {
  async listVisible(): Promise<UserPresenceRow[]> {
    const { data, error } = await supabase.from("user_presence").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as UserPresenceRow[];
  },

  async heartbeat(userId: string, status: PresenceStatus): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase.from("user_presence").upsert({
      user_id: userId,
      status,
      last_seen_at: now,
      updated_at: now,
    });
    if (error) throw new Error(error.message);
  },

  async setInvisible(userId: string): Promise<void> {
    const { error } = await supabase.from("user_presence").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  subscribe(
    onChange: (payload: RealtimePostgresChangesPayload<UserPresenceRow>) => void,
  ): RealtimeChannel {
    return supabase
      .channel(`user-presence:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, onChange)
      .subscribe();
  },

  unsubscribe(channel: RealtimeChannel) {
    return supabase.removeChannel(channel);
  },
};
