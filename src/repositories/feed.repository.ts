import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type { BioPostRow } from "@/types/database/tables";

export const FeedRepository = {
  async getFeed(limit = 20, offset = 0): Promise<BioPostRow[]> {
    const { data, error } = await supabase
      .from("bio_posts")
      .select("*, author:profiles(*)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async getById(id: string): Promise<BioPostRow> {
    const { data, error } = await supabase
      .from("bio_posts")
      .select("*, author:profiles(*)")
      .eq("id", id)
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return data;
  },

  async create(
    data: Omit<BioPostRow, "id" | "created_at" | "updated_at">
  ): Promise<BioPostRow> {
    const { data: created, error } = await supabase
      .from("bio_posts")
      .insert(data)
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return created;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("bio_posts").delete().eq("id", id);
    if (error) throw new SupabaseError(error.message, error.code);
  },

  async like(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: postId, user_id: userId });
    if (error) throw new SupabaseError(error.message, error.code);
  },

  async unlike(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw new SupabaseError(error.message, error.code);
  },
};
