import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { ChatService } from "@/services/chat.service";
import { dbRowsToChatMessages, dbRowToChatMessage } from "@/lib/chat/chat-adapter";
import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import { supabase } from "@/lib/supabase/client";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import { getMessages, sendLocalMediaMessage, sendLocalMessage, sendLocationMessage, sendSharedContentMessage } from "@/lib/demo/demo-db";
import { saveLocalMedia, getLocalMediaObjectUrl } from "@/lib/media/local-media-storage";
import { isRemoteConversationsEnabled } from "@/lib/chat/schema-a-conversations-flag";
import { getSchemaAConversations } from "@/lib/chat/schema-a-conversations";
import { demoRowsToChatMessages } from "@/lib/chat/demo-chat-adapter";
import { deleteOwnChatMessages } from "@/lib/chat/chat-message-actions";

const PAGE_SIZE = 50;

export function localChatQueryKey(conversationId: string | null) {
  return ["local-chat-messages", conversationId] as const;
}

function readLocalChatMessages(
  conversationId: string,
  currentUserId: string | null,
): ChatMessage[] {
  return demoRowsToChatMessages(conversationId, getMessages(conversationId), currentUserId);
}

function schemaAMessageToChat(message: {
  id: string;
  conversationId: string;
  text: string;
  at: number;
  from: "me" | "them";
}): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    from: message.from,
    kind: MessageKind.TEXT,
    text: message.text,
    at: new Date(message.at),
    status: message.from === "me" ? "sent" : "delivered",
  };
}

interface UseChatOptions {
  conversationId: string | null;
  currentUserId: string | null;
}

export function useChat({ conversationId, currentUserId }: UseChatOptions) {
  const queryClient = useQueryClient();
  const schemaA = isRemoteConversationsEnabled();
  const local = !schemaA && !isPublicSupabaseConfigured();
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
    queryFn: () => (conversationId ? readLocalChatMessages(conversationId, currentUserId) : []),
    enabled: local && Boolean(conversationId),
    staleTime: Infinity,
    initialData: () =>
      local && conversationId ? readLocalChatMessages(conversationId, currentUserId) : undefined,
  });

  useEffect(() => {
    if (!local || !conversationId) return;
    const key = localChatQueryKey(conversationId);
    const sync = () => {
      queryClient.setQueryData(key, readLocalChatMessages(conversationId, currentUserId));
    };
    sync();
    setHasMore(false);
    setError(null);
    setIsLoading(false);
    setSubscriptionStatus("connected");
    window.addEventListener("connexy:demo:db", sync);
    return () => window.removeEventListener("connexy:demo:db", sync);
  }, [local, conversationId, currentUserId, queryClient]);

  const demoSend = useCallback(
    (text: string) => {
      if (!local || !conversationId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      const identity = getDemoIdentity();
      sendLocalMessage(conversationId, "me", trimmed, identity);
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId, currentUserId),
      );
    },
    [local, conversationId, currentUserId, queryClient],
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
      sendSharedContentMessage(conversationId, "me", payload, text, getDemoIdentity());
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId, currentUserId),
      );
    },
    [local, conversationId, currentUserId, queryClient],
  );

  const sendMedia = useCallback(
    async (input: {
      kind: "image" | "video" | "audio" | "file";
      blob: Blob;
      mimeType: string;
      fileName: string;
      durationSec?: number;
    }) => {
      if (!local || !conversationId) return;
      const record = await saveLocalMedia({
        kind: input.kind === "audio" ? "audio" : "photo",
        scope: "conversation",
        blob: input.blob,
        mimeType: input.mimeType,
        fileName: input.fileName,
        durationMs: input.durationSec ? input.durationSec * 1000 : undefined,
      });
      await getLocalMediaObjectUrl(record.id);
      sendLocalMediaMessage(
        conversationId,
        input.kind,
        {
          mediaId: record.id,
          mimeType: record.mimeType,
          fileName: input.fileName,
          durationSec: input.durationSec,
          fileSize: input.blob.size,
        },
        getDemoIdentity(),
      );
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId, currentUserId),
      );
    },
    [local, conversationId, currentUserId, queryClient],
  );

  const sendLocation = useCallback(
    (input: { label: string; proximity: string; lat: number; lng: number }) => {
      if (!local || !conversationId) return;
      sendLocationMessage(conversationId, input, getDemoIdentity());
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId, currentUserId),
      );
    },
    [local, conversationId, currentUserId, queryClient],
  );

  const deleteMessages = useCallback(
    async (messageIds: readonly string[]) => {
      if (!local || !conversationId || !currentUserId) {
        return {
          deletedIds: [] as string[],
          failed: [{ messageId: messageIds[0] ?? "", reason: "not-found" as const }],
        };
      }
      const result = await deleteOwnChatMessages({
        conversationId,
        currentUserId,
        messageIds,
      });
      queryClient.setQueryData(
        localChatQueryKey(conversationId),
        readLocalChatMessages(conversationId, currentUserId),
      );
      return result;
    },
    [local, conversationId, currentUserId, queryClient],
  );

  const sendSchemaAMessage = useCallback(
    async (text: string) => {
      if (!schemaA || !conversationId) return;
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
        const sent = await getSchemaAConversations().sendMessage(conversationId, trimmed);
        setRemoteMessages((prev) =>
          prev.map((item) => (item.id === tempId ? schemaAMessageToChat(sent) : item)),
        );
      } catch (err) {
        setRemoteMessages((prev) => prev.filter((item) => item.id !== tempId));
        setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      }
    },
    [schemaA, conversationId],
  );

  const loadMessages = useCallback(async () => {
    if (local || schemaA || !conversationId || !currentUserId || !isPublicSupabaseConfigured())
      return;
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
  }, [conversationId, currentUserId, local, schemaA]);

  useEffect(() => {
    if (!schemaA || !conversationId) {
      if (schemaA) {
        setRemoteMessages([]);
        setHasMore(false);
        setSubscriptionStatus("disconnected");
      }
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setHasMore(false);
    setSubscriptionStatus("connected");
    void (async () => {
      try {
        const chat = getSchemaAConversations();
        const rows = await chat.listMessages(conversationId);
        if (cancelled) return;
        setRemoteMessages(rows.map(schemaAMessageToChat));
        await chat.markRead(conversationId);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
          setRemoteMessages([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schemaA, conversationId]);

  useEffect(() => {
    if (local || schemaA) return;
    void loadMessages();
  }, [loadMessages, local, schemaA]);

  useEffect(() => {
    if (local || schemaA) return;
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
  }, [conversationId, local, schemaA]);

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
    if (local || schemaA || !conversationId || !currentUserId || isLoading || !hasMore) return;
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
  }, [conversationId, currentUserId, isLoading, hasMore, local, schemaA]);

  if (local) {
    return {
      messages: localQuery.data ?? [],
      isLoading: false,
      error: null,
      hasMore: false,
      sendMessage: demoSend,
      sendSharedContent,
      sendMedia,
      sendLocation,
      deleteMessages,
      loadMore: () => Promise.resolve(),
      retry: demoSend,
      subscriptionStatus,
    };
  }

  if (schemaA) {
    return {
      messages: remoteMessages,
      isLoading,
      error,
      hasMore: false,
      sendMessage: sendSchemaAMessage,
      sendSharedContent: () => undefined,
      sendMedia: async () => undefined,
      sendLocation: () => undefined,
      deleteMessages: async () => ({ deletedIds: [], failed: [] }),
      loadMore: () => Promise.resolve(),
      retry: () => {
        if (!conversationId) return;
        void getSchemaAConversations()
          .listMessages(conversationId)
          .then((rows) => setRemoteMessages(rows.map(schemaAMessageToChat)))
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
          });
      },
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
    sendMedia: async () => undefined,
    sendLocation: () => undefined,
    deleteMessages: async () => ({ deletedIds: [], failed: [] }),
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
