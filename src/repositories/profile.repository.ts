import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type {
  ProfileRow,
  MomentRow,
  CompatibilityRow,
} from "@/types/database/tables";

export const ProfileRepository = {
  async getProfile(userId: string): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async updateProfile(
    userId: string,
    data: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>
  ): Promise<ProfileRow> {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return updated;
  },

  async getMoments(userId: string): Promise<MomentRow[]> {
    const { data, error } = await supabase
      .from("moments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async createMoment(
    data: Omit<MomentRow, "id" | "created_at">
  ): Promise<MomentRow> {
    const { data: created, error } = await supabase
      .from("moments")
      .insert(data)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return created;
  },

  async deleteMoment(id: string): Promise<void> {
    const { error } = await supabase.from("moments").delete().eq("id", id);
    if (error) throw new SupabaseError(error.message, error.code);
  },

  async getCompatibility(
    userId1: string,
    userId2: string
  ): Promise<CompatibilityRow> {
    const { data, error } = await supabase
      .from("compatibility")
      .select("*")
      .or(
        `and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`
      )
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },
};
