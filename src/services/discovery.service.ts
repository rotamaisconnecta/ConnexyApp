import { ProfileRepository } from "@/repositories/profile.repository";
import { supabase } from "@/lib/supabase/client";

export const DiscoveryService = {
  async getNearbyPeople(userId: string, lat: number, lng: number, radius: number) {
    if (lat < -90 || lat > 90) {
      throw new Error("Invalid latitude");
    }
    if (lng < -180 || lng > 180) {
      throw new Error("Invalid longitude");
    }
    if (radius <= 0 || radius > 100) {
      throw new Error("Radius must be between 0 and 100 km");
    }

    const { data, error } = await supabase.rpc("get_nearby_profiles", {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radius,
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  },

  async getCompatibility(userId1: string, userId2: string) {
    const compatibility = await ProfileRepository.getCompatibility(userId1, userId2);
    return compatibility;
  },

  async sendConnectionRequest(fromId: string, toId: string) {
    if (fromId === toId) {
      throw new Error("Cannot send a connection request to yourself");
    }

    const { data, error } = await supabase
      .from("connection_requests")
      .insert({
        from_user_id: fromId,
        to_user_id: toId,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acceptConnectionRequest(requestId: string) {
    const { data, error } = await supabase
      .from("connection_requests")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
