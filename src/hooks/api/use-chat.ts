import { useCallback, useEffect, useRef, useState } from "react";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { ChatService } from "@/services/chat.service";
import { ChatRepository } from "@/repositories/chat.repository";
import { dbRowsToChatMessages, dbRowToChatMessage } from "@/lib/chat/chat-adapter";
import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import { supabase } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo/demo-config";
import { getMessages, sendLocalMessage } from "@/lib/demo/demo-db";

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

  // ── Demo mode: fully local messages, no Supabase/Realtime ──────────────
  const demo = isDemoMode();

  useEffect(() => {
    if (!demo || !conversationId) return;
    const sync = () => {
      const rows = getMessages(conversationId);
      const adapted: ChatMessage[] = rows.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        from: m.from,
        kind: MessageKind.TEXT,
        text: m.text,
        at: new Date(m.at),
        status: "read" as const,
      }));
      setMessages(adapted);
      setHasMore(false);
      setError(null);
      setIsLoading(false);
    };
    sync();
    setSubscriptionStatus("connected");
    window.addEventListener("connexy:demo:db", sync);
    return () => window.removeEventListener("connexy:demo:db", sync);
  }, [demo, conversationId]);

  const demoSend = useCallback(
    (text: string) => {
      if (!demo || !conversationId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      const local = sendLocalMessage(conversationId, "me", trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: local.id,
          conversationId: local.conversationId,
          from: "me",
          kind: MessageKind.TEXT,
          text: local.text,
          at: new Date(local.at),
          status: "sent" as const,
        },
      ]);
    },
    [demo, conversationId],
  );

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
    if (demo) return;
    void loadMessages();
  }, [loadMessages, demo]);

  // Realtime subscription
  useEffect(() => {
    if (demo) return;
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
  }, [conversationId, demo]);

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

  if (demo) {
    return {
      messages,
      isLoading: false,
      error: null,
      hasMore: false,
      sendMessage: demoSend,
      loadMore: () => Promise.resolve(),
      retry: demoSend,
      subscriptionStatus,
    };
  }

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
