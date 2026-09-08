import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { ChatService } from "@/services/chat.service";
import { dbRowsToChatMessages, dbRowToChatMessage } from "@/lib/chat/chat-adapter";
import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import { supabase } from "@/lib/supabase/client";
import { getMessages, sendLocalMessage, sendSharedContentMessage } from "@/lib/demo/demo-db";

const PAGE_SIZE = 50;

export function localChatQueryKey(conversationId: string | null) {
  return ["local-chat-messages", conversationId] as const;
}

function demoRowsToChatMessages(
  conversationId: string,
  rows: ReturnType<typeof getMessages>,
): ChatMessage[] {
  return rows.map((m) => {
    if (m.kind === "event" && m.payload) {
      return {
        id: m.id,
        conversationId: m.conversationId || conversationId,
        from: m.from,
        kind: MessageKind.EVENT,
        title: m.payload.title ?? m.text,
        cover: m.payload.cover,
        dateText: m.payload.dateText,
        location: m.payload.location,
        contentId: m.payload.id,
        contentType: "event",
        route: m.payload.route,
        at: new Date(m.at),
        status: "read" as const,
      } satisfies ChatMessage;
    }

    if (m.kind === "location" && m.payload) {
      return {
        id: m.id,
        conversationId: m.conversationId || conversationId,
        from: m.from,
        kind: MessageKind.LOCATION,
        label: m.payload.title ?? m.text,
        proximity: m.payload.proximity ?? "Local compartilhado",
        cover: m.payload.cover,
        lat: undefined,
        lng: undefined,
        contentId: m.payload.id,
        contentType: "place",
        route: m.payload.route,
        at: new Date(m.at),
        status: "read" as const,
      } satisfies ChatMessage;
    }

    return {
      id: m.id,
      conversationId: m.conversationId || conversationId,
      from: m.from,
      kind: MessageKind.TEXT,
      text: m.text,
      at: new Date(m.at),
      status: "read" as const,
    } satisfies ChatMessage;
  });
}

function readLocalChatMessages(conversationId: string): ChatMessage[] {
  return demoRowsToChatMessages(conversationId, getMessages(conversationId));
}

interface UseChatOptions {
  conversationId: string | null;
  currentUserId: string | null;
}

export function useChat({ conversationId, currentUserId }: UseChatOptions) {
  const queryClient = useQueryClient();
  const local = !isPublicSupabaseConfigured();
  const queryKey = localChatQueryKey(conversationId);

  const [remoteMessages, setRemoteMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >(local ? "connected" : "disconnected");
  const pageRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const localQuery = useQuery({
    queryKey,
    queryFn: () => (conversationId ? readLocalChatMessages(conversationId) : []),
    enabled: local && Boolean(conversationId),
    staleTime: Infinity,
    initialData: () =>
      local && conversationId ? readLocalChatMessages(conversationId) : undefined,
  });

  useEffect(() => {
    if (!local || !conversationId) return;
    const key = localChatQueryKey(conversationId);
    const sync = () => {
      queryClient.setQueryData(key, readLocalChatMessages(conversationId));
    };
    sync();
    setHasMore(false);
    setError(null);
    setIsLoading(false);
    setSubscriptionStatus("connected");
    window.addEventListener("connexy:demo:db", sync);
    return () => window.removeEventListener("connexy:demo:db", sync);
  }, [local, conversationId, queryClient]);

  const demoSend = useCallback(
    (text: string) => {
      if (!local || !conversationId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      sendLocalMessage(conversationId, "me", trimmed);
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId),
      );
    },
    [local, conversationId, queryClient],
  );

  const sendSharedContent = useCallback(
    (
      payload: {
        id: string;
        title: string;
        type: "event" | "place";
        cover?: string;
        location?: string;
        dateText?: string;
        proximity?: string;
        route?: string;
      },
      text?: string,
    ) => {
      if (!local || !conversationId) return;
      sendSharedContentMessage(conversationId, "me", payload, text);
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId),
      );
    },
    [local, conversationId, queryClient],
  );

  const loadMessages = useCallback(async () => {
    if (local || !conversationId || !currentUserId || !isPublicSupabaseConfigured()) return;
    setIsLoading(true);
    setError(null);
    pageRef.current = 0;
    try {
      const rows = await ChatService.getMessages(conversationId, 0);
      const adapted = dbRowsToChatMessages(rows as Record<string, unknown>[], currentUserId);
      setRemoteMessages(adapted);
      setHasMore(rows.length >= PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, local]);

  useEffect(() => {
    if (local) return;
    void loadMessages();
  }, [loadMessages, local]);

  useEffect(() => {
    if (local) return;
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
          setRemoteMessages((prev) => mergeIncomingMessage(prev, newRow, uid));
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
            setRemoteMessages((prev) => prev.filter((m) => m.id !== updated.id));
            return;
          }
          const adapted = dbRowToChatMessage(updated, uid);
          if (!adapted) return;
          setRemoteMessages((prev) => prev.map((m) => (m.id === adapted.id ? adapted : m)));
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
  }, [conversationId, local]);

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

      setRemoteMessages((prev) => {
        if (hasSamePendingText(prev, trimmed)) return prev;
        return [...prev, optimistic];
      });

      try {
        const sent = (await ChatService.sendMessage(
          conversationId,
          currentUserId,
          trimmed,
        )) as Record<string, unknown>;
        const sentId = String(sent.id ?? "");
        setRemoteMessages((prev) =>
          reconcileOptimisticMessage(prev, tempId, sentId, currentUserId, sent),
        );
      } catch (err) {
        setRemoteMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sending" as const } : m)),
        );
        setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      }
    },
    [conversationId, currentUserId],
  );

  const loadMore = useCallback(async () => {
    if (local || !conversationId || !currentUserId || isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      pageRef.current += 1;
      const rows = await ChatService.getMessages(conversationId, pageRef.current);
      const adapted = dbRowsToChatMessages(rows as Record<string, unknown>[], currentUserId);
      setRemoteMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        return [...adapted.filter((m) => !existing.has(m.id)), ...prev];
      });
      if (rows.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
      pageRef.current -= 1;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, isLoading, hasMore, local]);

  if (local) {
    return {
      messages: localQuery.data ?? [],
      isLoading: false,
      error: null,
      hasMore: false,
      sendMessage: demoSend,
      sendSharedContent,
      loadMore: () => Promise.resolve(),
      retry: demoSend,
      subscriptionStatus,
    };
  }

  return {
    messages: remoteMessages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    sendSharedContent,
    loadMore,
    retry: loadMessages,
    subscriptionStatus,
  };
}

function hasSamePendingText(messages: ChatMessage[], text: string): boolean {
  return messages.some(
    (message) =>
      message.from === "me" &&
      message.kind === MessageKind.TEXT &&
      message.text === text &&
      (message.id.startsWith("temp-") || message.status === "sending"),
  );
}

function mergeIncomingMessage(
  prev: ChatMessage[],
  newRow: Record<string, unknown>,
  uid: string,
): ChatMessage[] {
  if (prev.some((m) => m.id === newRow.id)) return prev;
  const adapted = dbRowToChatMessage(newRow, uid);
  if (!adapted) return prev;
  const optimisticIndex = prev.findIndex(
    (m) =>
      m.id.startsWith("temp-") &&
      m.from === "me" &&
      adapted.from === "me" &&
      m.kind === MessageKind.TEXT &&
      adapted.kind === MessageKind.TEXT &&
      m.text === adapted.text,
  );
  if (optimisticIndex >= 0) {
    const next = [...prev];
    next[optimisticIndex] = adapted;
    return next;
  }
  return [...prev, adapted];
}

function reconcileOptimisticMessage(
  prev: ChatMessage[],
  tempId: string,
  sentId: string,
  uid: string,
  sent: Record<string, unknown>,
): ChatMessage[] {
  if (sentId && prev.some((m) => m.id === sentId)) {
    return prev.filter((m) => m.id !== tempId);
  }
  const adapted = dbRowToChatMessage({ ...sent, sender_id: sent.sender_id ?? uid }, uid);
  return prev.map((m) => {
    if (m.id !== tempId) return m;
    if (adapted) return { ...adapted, status: "sent" as const };
    return {
      ...m,
      id: sentId || m.id,
      status: "sent" as const,
    };
  });
}
