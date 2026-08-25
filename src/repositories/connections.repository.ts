import { supabase } from "@/lib/supabase/client";
import type {
  ConnectionRequestRow,
  ConnectionRow,
  NearbyProfile,
  UserLocationInput,
} from "@/types/phase-13b";

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Supabase returned no data");
  return data;
}

export const ConnectionsRepository = {
  async listNearby(radiusKm = 25, limit = 50): Promise<NearbyProfile[]> {
    const { data, error } = await supabase.rpc("get_nearby_profiles", {
      p_radius_km: radiusKm,
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as NearbyProfile[];
  },

  async sendRequest(receiverId: string): Promise<ConnectionRequestRow> {
    const { data, error } = await supabase.rpc("send_connection_request", {
      receiver_id: receiverId,
    });
    return requireData(data as ConnectionRequestRow | null, error);
  },

  async respond(requestId: string, decision: "accepted" | "rejected") {
    const { data, error } = await supabase.rpc("respond_to_connection_request", {
      request_id: requestId,
      decision,
    });
    return requireData(data as ConnectionRequestRow | null, error);
  },

  async cancel(requestId: string): Promise<ConnectionRequestRow> {
    const { data, error } = await supabase.rpc("cancel_connection_request", {
      request_id: requestId,
    });
    return requireData(data as ConnectionRequestRow | null, error);
  },

  async list(): Promise<ConnectionRow[]> {
    const { data, error } = await supabase.from("connections").select("*").order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as ConnectionRow[];
  },

  async remove(connectionId: string): Promise<void> {
    const { error } = await supabase.rpc("remove_connection", { connection_id: connectionId });
    if (error) throw new Error(error.message);
  },

  async block(userId: string): Promise<void> {
    const { error } = await supabase.rpc("block_user", { blocked_id: userId });
    if (error) throw new Error(error.message);
  },

  async unblock(userId: string): Promise<void> {
    const { error } = await supabase.rpc("unblock_user", { blocked_id: userId });
    if (error) throw new Error(error.message);
  },

  async findIncomingPendingRequest(senderId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc("find_pending_request_for_receiver", {
      p_sender_id: senderId,
    });
    if (error) throw new Error(error.message);
    return (data as string | null) ?? null;
  },

  async getDirectConversation(otherUserId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc("get_direct_conversation", {
      other_user_id: otherUserId,
    });
    if (error) throw new Error(error.message);
    return data as string | null;
  },

  async updateLocation(userId: string, location: UserLocationInput): Promise<void> {
    const { error } = await supabase.from("user_locations").upsert({
      user_id: userId,
      ...location,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },
};
