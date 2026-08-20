import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";
import type { ConversationRow, MessageRow } from "@/types/database/tables";

export const ChatRepository = {
  async getConversations(userId: string): Promise<ConversationRow[]> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, participants:conversation_participants(*, profile:profiles(*))")
      .filter("conversation_participants.user_id", "eq", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<MessageRow[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles(*)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new SupabaseError(error.message, error.code);
    return data ?? [];
  },

  async sendMessage(
    conversationId: string,
    data: Omit<MessageRow, "id" | "created_at" | "read_at">,
  ): Promise<MessageRow> {
    const { data: created, error } = await supabase
      .from("messages")
      .insert({ ...data, conversation_id: conversationId })
      .select()
      .single();
    if (error) throw new SupabaseError(error.message, error.code);
    return created;
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new SupabaseError(error.message, error.code);
  },

  async getDirectConversation(otherUserId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc("get_direct_conversation", {
      other_user_id: otherUserId,
    });
    if (error) throw new SupabaseError(error.message, error.code);
    return data as string | null;
  },
};
