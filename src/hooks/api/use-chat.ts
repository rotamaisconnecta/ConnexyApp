import { useCallback, useEffect, useRef, useState } from "react";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { ChatService } from "@/services/chat.service";
import { ChatRepository } from "@/repositories/chat.repository";
import { dbRowsToChatMessages, dbRowToChatMessage } from "@/lib/chat/chat-adapter";
import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import { supabase } from "@/lib/supabase/client";

const PAGE_SIZE = 50;

interface UseChatOptions {
  conversationId: string | null;
  currentUserId: string | null;
}

export function useChat({ conversationId, currentUserId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");
  const pageRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!conversationId || !currentUserId || !isPublicSupabaseConfigured()) return;
    setIsLoading(true);
    setError(null);
    pageRef.current = 0;
    try {
      const rows = await ChatService.getMessages(conversationId, 0);
      const adapted = dbRowsToChatMessages(rows as Record<string, unknown>[], currentUserId);
      setMessages(adapted);
      setHasMore(rows.length >= PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !isPublicSupabaseConfigured()) {
      setSubscriptionStatus("disconnected");
      return;
    }

    let active = true;
    setSubscriptionStatus("connecting");

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!active) return;
          const uid = currentUserIdRef.current;
          if (!uid) return;
          const newRow = payload.new as Record<string, unknown>;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            const adapted = dbRowToChatMessage(newRow, uid);
            if (!adapted) return prev;
            return [...prev, adapted];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!active) return;
          const uid = currentUserIdRef.current;
          if (!uid) return;
          const updated = payload.new as Record<string, unknown>;
          if (updated.deleted_at) {
            setMessages((prev) => prev.filter((m) => m.id !== updated.id));
            return;
          }
          const adapted = dbRowToChatMessage(updated, uid);
          if (!adapted) return;
          setMessages((prev) => prev.map((m) => (m.id === adapted.id ? adapted : m)));
        },
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") setSubscriptionStatus("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setSubscriptionStatus("disconnected");
      });

    channelRef.current = channel;

    return () => {
      active = false;
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setSubscriptionStatus("disconnected");
    };
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !currentUserId) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        from: "me",
        kind: MessageKind.TEXT,
        text: trimmed,
        at: new Date(),
        status: "sending",
      };

      setMessages((prev) => [...prev, optimistic]);

      try {
        const sent = (await ChatService.sendMessage(
          conversationId,
          currentUserId,
          trimmed,
        )) as Record<string, unknown>;
        const sentId = sent.id as string;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== tempId) return m;
            return {
              ...m,
              id: sentId,
              status: "sent" as const,
            } as ChatMessage;
          }),
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sending" as const } : m)),
        );
        setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      }
    },
    [conversationId, currentUserId],
  );

  // Load more (older messages)
  const loadMore = useCallback(async () => {
    if (!conversationId || !currentUserId || isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      pageRef.current += 1;
      const rows = await ChatService.getMessages(conversationId, pageRef.current);
      const adapted = dbRowsToChatMessages(rows as Record<string, unknown>[], currentUserId);
      setMessages((prev) => [...adapted, ...prev]);
      if (rows.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
      pageRef.current -= 1;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, isLoading, hasMore]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    loadMore,
    retry: loadMessages,
    subscriptionStatus,
  };
}
