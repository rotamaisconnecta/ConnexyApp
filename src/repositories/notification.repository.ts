import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type { NotificationRow } from "@/types/database/tables";

export const NotificationRepository = {
  async getByUserId(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<NotificationRow[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async markAsRead(id: string): Promise<NotificationRow> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new SupabaseError(error.message, error.code);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw new SupabaseError(error.message, error.code);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new SupabaseError(error.message, error.code);
    return count ?? 0;
  },
};
