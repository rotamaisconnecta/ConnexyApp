import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type { RideRow } from "@/types/database/tables";

export const RideRepository = {
  async getActiveRide(userId: string): Promise<RideRow | null> {
    const { data, error } = await supabase
      .from("rides")
      .select("*, driver:profiles!driver_id(*), passenger:profiles!passenger_id(*)")
      .or(`driver_id.eq.${userId},passenger_id.eq.${userId}`)
      .in("status", ["requested", "accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async getHistory(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<RideRow[]> {
    const { data, error } = await supabase
      .from("rides")
      .select("*, driver:profiles!driver_id(*), passenger:profiles!passenger_id(*)")
      .or(`driver_id.eq.${userId},passenger_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async createRequest(
    data: Omit<RideRow, "id" | "created_at" | "updated_at" | "status">
  ): Promise<RideRow> {
    const { data: created, error } = await supabase
      .from("rides")
      .insert({ ...data, status: "requested" })
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return created;
  },

  async updateStatus(
    id: string,
    status: RideRow["status"]
  ): Promise<RideRow> {
    const { data, error } = await supabase
      .from("rides")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async rateRide(
    id: string,
    rating: number,
    comment?: string
  ): Promise<RideRow> {
    const { data, error } = await supabase
      .from("rides")
      .update({ rating, rating_comment: comment ?? null })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },
};
