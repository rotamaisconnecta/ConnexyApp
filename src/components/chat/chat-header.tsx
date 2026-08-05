import { ChevronLeft, Phone, Search, Video, MoreVertical } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationParticipant } from "@/lib/chat/chat-types";

interface ChatHeaderProps {
  participant: ConversationParticipant;
  proximity?: string;
  onBack: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: () => void;
  onMenu?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function ChatHeader({
  participant,
  proximity,
  onBack,
  onCall,
  onVideoCall,
  onSearch,
  onMenu,
}: ChatHeaderProps) {
  const status = participant.online
    ? "Online agora"
    : participant.lastSeen
      ? `visto por último ${participant.lastSeen}`
      : "Offline";

  return (
    <header className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface/80 backdrop-blur-md">
      <button
        type="button"
        onClick={onBack}
        className="h-9 w-9 rounded-xl grid place-items-center hover:bg-accent transition-colors"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        aria-label={`Perfil de ${participant.name}`}
      >
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 rounded-xl">
            <AvatarImage
              src={participant.photo}
              alt={`Foto de ${participant.name}`}
              className="rounded-xl"
            />
            <AvatarFallback className="rounded-xl bg-gradient-brand text-white text-[11px] font-bold">
              {getInitials(participant.name)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot online={participant.online} size={8} />
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{participant.name}</h2>
          <p
            className={cn(
              "text-[10px] truncate",
              participant.online ? "text-success font-medium" : "text-muted-foreground",
            )}
          >
            {status}
            {proximity ? (
              <span className={cn(!participant.online && "text-muted-foreground font-normal")}>
                {" · "}
                {proximity}
              </span>
            ) : null}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-0.5">
        {onCall && (
          <button
            type="button"
            onClick={onCall}
            className="h-9 w-9 rounded-xl grid place-items-center hover:bg-accent transition-colors"
            aria-label="Ligar"
          >
            <Phone className="h-4 w-4" />
          </button>
        )}
        {onVideoCall && (
          <button
            type="button"
            onClick={onVideoCall}
            className="h-9 w-9 rounded-xl grid place-items-center hover:bg-accent transition-colors"
            aria-label="Videocall"
          >
            <Video className="h-4 w-4" />
          </button>
        )}
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="h-9 w-9 rounded-xl grid place-items-center hover:bg-accent transition-colors"
            aria-label="Buscar na conversa"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            className="h-9 w-9 rounded-xl grid place-items-center hover:bg-accent transition-colors"
            aria-label="Mais opções"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
