import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionsService } from "@/services/connections.service";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import {
  canRemoteConversationTarget,
  getSchemaAConversations,
} from "@/lib/chat/schema-a-conversations";
import { isRemoteConversationsEnabled } from "@/lib/chat/schema-a-conversations-flag";
import { getConnectionBetween } from "@/lib/demo/demo-db";
import { useDemoIsConnected, useDemoOutgoingRequest } from "@/lib/demo/use-demo-db";
import { useAuth } from "@/hooks/use-auth";

type InviteStatus = "loading" | "connected" | "invited" | "available";

interface ConversationInviteButtonProps {
  personId: string;
  personName: string;
  variant?: "compact" | "profile";
  className?: string;
}

export function ConversationInviteButton({
  personId,
  personName,
  variant = "compact",
  className,
}: ConversationInviteButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<InviteStatus>("loading");
  const demoConnected = useDemoIsConnected(personId, user?.id);
  const demoOutgoingRequest = useDemoOutgoingRequest(user?.id, personId);
  const demo = isDemoMode();
  const remoteChat = isRemoteConversationsEnabled();
  const [remoteConversationId, setRemoteConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (demo) {
      setStatus(demoConnected ? "connected" : demoOutgoingRequest ? "invited" : "available");
      return;
    }
    if (remoteChat) {
      if (!canRemoteConversationTarget(personId)) {
        setStatus("available");
        return;
      }
      let cancelled = false;
      void (async () => {
        try {
          const existing = await getSchemaAConversations().findDirectWith(personId);
          if (cancelled) return;
          setRemoteConversationId(existing?.conversation.id ?? null);
          setStatus(existing ? "connected" : "available");
        } catch {
          if (!cancelled) setStatus("available");
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    if (!isPublicSupabaseConfigured()) {
      setStatus("available");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const conversationId = await ConnectionsService.getDirectConversation(personId);
        if (!cancelled) setStatus(conversationId ? "connected" : "available");
      } catch {
        if (!cancelled) setStatus("available");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personId, demo, demoConnected, demoOutgoingRequest, remoteChat]);

  const connected = status === "connected";
  const label = connected
    ? "Conversar"
    : status === "invited"
      ? "Convite enviado"
      : status === "loading"
        ? "Carregando..."
        : "Connexy";

  const handleClick = useCallback(async () => {
    if (status === "invited") return;
    if (!connected) {
      if (remoteChat) {
        if (!canRemoteConversationTarget(personId)) return;
        setStatus("loading");
        try {
          const existing = await getSchemaAConversations().findDirectWith(personId);
          const thread = existing ?? (await getSchemaAConversations().createDirect(personId));
          setRemoteConversationId(thread.conversation.id);
          setStatus("connected");
          navigate({
            to: "/chat/$conversationId",
            params: { conversationId: thread.conversation.id },
          });
        } catch {
          setStatus("available");
        }
        return;
      }
      navigate({
        to: "/solicitacao/$id",
        params: { id: personId },
        search: { mode: "send" },
      });
      return;
    }

    if (remoteChat) {
      const conversationId = remoteConversationId;
      if (!conversationId) return;
      navigate({
        to: "/chat/$conversationId",
        params: { conversationId },
      });
      return;
    }

    if (demo) {
      const conversationId = user?.id
        ? getConnectionBetween(user.id, personId)?.conversationId
        : null;
      navigate({
        to: "/chat/$conversationId",
        params: { conversationId: conversationId ?? personId },
      });
      return;
    }

    try {
      const conversationId = await ConnectionsService.getDirectConversation(personId);
      navigate({
        to: "/chat/$conversationId",
        params: { conversationId: conversationId ?? personId },
      });
    } catch {
      navigate({ to: "/chat/$conversationId", params: { conversationId: personId } });
    }
  }, [connected, demo, navigate, personId, remoteChat, remoteConversationId, status, user?.id]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading" || status === "invited"}
      aria-label={`${label}: ${personName}`}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 active:scale-[0.98]",
        variant === "profile" ? "h-12 w-full rounded-2xl text-sm" : "h-8 px-3 text-[11px]",
        connected ? "bg-primary/10 text-primary" : "bg-gradient-brand text-white shadow-soft",
        status === "loading" && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
