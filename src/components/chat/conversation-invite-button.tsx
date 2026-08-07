import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getConversationId,
  getConversationInviteStatus,
  type ConversationInviteStatus,
} from "@/lib/chat/mock-conversation-invites";

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
  const [status] = useState<ConversationInviteStatus>(() => getConversationInviteStatus(personId));

  const connected = status === "connected";
  const invited = status === "invited";

  const label = connected
    ? "Abrir conversa"
    : invited
      ? "Convite enviado"
      : status === "rejected"
        ? "Convidar novamente"
        : variant === "profile"
          ? "Convidar para conversar"
          : "Conversar";

  const Icon = invited ? Check : MessageSquare;

  function handleClick() {
    if (connected) {
      const conversationId = getConversationId(personId) ?? personId;
      navigate({ to: "/chat/$conversationId", params: { conversationId } });
      return;
    }
    if (!invited) {
      toast.success(`Abrindo convite para ${personName}`);
    }
    navigate({
      to: "/solicitacao/$id",
      params: { id: personId },
      search: { mode: "send" },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 active:scale-[0.98]",
        variant === "profile" ? "h-12 w-full rounded-2xl text-sm" : "h-8 px-3 text-[11px]",
        invited
          ? "bg-secondary text-muted-foreground"
          : connected
            ? "bg-primary/10 text-primary"
            : "bg-gradient-brand text-white shadow-soft",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", invited && "h-3.5 w-3.5")} />
      {label}
    </button>
  );
}
