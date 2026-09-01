import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionsService } from "@/services/connections.service";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { useDemoIsConnected } from "@/lib/demo/use-demo-db";

type InviteStatus = "loading" | "connected" | "available";

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
  const [status, setStatus] = useState<InviteStatus>("loading");
  const demoConnected = useDemoIsConnected(personId);
  const demo = isDemoMode();

  useEffect(() => {
    if (demo) {
      setStatus(demoConnected ? "connected" : "available");
      return;
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
  }, [personId, demo, demoConnected]);

  const connected = status === "connected";
  const label = connected
    ? "Conversar"
    : status === "loading"
      ? "Carregando..."
      : variant === "profile"
        ? "Convidar para conversar"
        : "Conversar";

  const handleClick = useCallback(async () => {
    if (!connected) {
      navigate({
        to: "/solicitacao/$id",
        params: { id: personId },
        search: { mode: "send" },
      });
      return;
    }

    if (demo) {
      navigate({ to: "/chat/$conversationId", params: { conversationId: personId } });
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
  }, [connected, demo, navigate, personId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
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
