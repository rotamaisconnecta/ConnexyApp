import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type { ProfileRow } from "@/types/database/tables";

export const UserRepository = {
  async getById(id: string): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async getByHandle(handle: string): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async update(
    id: string,
    data: Partial<Omit<ProfileRow, "id" | "created_at">>
  ): Promise<ProfileRow> {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return updated;
  },

  async search(query: string): Promise<ProfileRow[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(
        `full_name.ilike.%${query}%,handle.ilike.%${query}%,bio.ilike.%${query}%`
      )
      .limit(20);
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<ProfileRow[]> {
    const { data, error } = await supabase.rpc("get_nearby_profiles", {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_km: radiusKm,
    });
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },
};
