import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionsService } from "@/services/connections.service";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";

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
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
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
  }, [personId]);

  const connected = status === "connected";
  const invited = status === "invited";

  const label = connected
    ? "Conversar"
    : invited
      ? "Convite enviado"
      : status === "loading"
        ? "Carregando..."
        : variant === "profile"
          ? "Convidar para conversar"
          : "Conversar";

  const Icon = invited ? Check : MessageSquare;

  const handleClick = useCallback(async () => {
    if (connected) {
      try {
        const conversationId = await ConnectionsService.getDirectConversation(personId);
        navigate({
          to: "/chat/$conversationId",
          params: { conversationId: conversationId ?? personId },
        });
      } catch {
        navigate({ to: "/chat/$conversationId", params: { conversationId: personId } });
      }
      return;
    }
    if (invited) return;
    if (!isPublicSupabaseConfigured()) {
      navigate({
        to: "/solicitacao/$id",
        params: { id: personId },
        search: { mode: "send" },
      });
      return;
    }
    setIsSending(true);
    try {
      await ConnectionsService.sendRequest(personId);
      setStatus("invited");
      toast.success(`Convite enviado para ${personName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o convite");
    } finally {
      setIsSending(false);
    }
  }, [connected, invited, navigate, personId, personName]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading" || isSending}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 active:scale-[0.98]",
        variant === "profile" ? "h-12 w-full rounded-2xl text-sm" : "h-8 px-3 text-[11px]",
        invited
          ? "bg-secondary text-muted-foreground"
          : connected
            ? "bg-primary/10 text-primary"
            : "bg-gradient-brand text-white shadow-soft",
        (status === "loading" || isSending) && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      {status === "loading" || isSending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className={cn("h-4 w-4", invited && "h-3.5 w-3.5")} />
      )}
      {label}
    </button>
  );
}
