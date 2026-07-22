import { ChevronLeft, Phone, Video, MoreVertical } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import type { ConversationParticipant } from "@/lib/chat/chat-types";

interface ChatHeaderProps {
  participant: ConversationParticipant;
  onBack: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMenu?: () => void;
}

export function ChatHeader({ participant, onBack, onCall, onVideoCall, onMenu }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-surface/80 backdrop-blur-md">
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
          <img
            src={participant.photo}
            alt={`Foto de ${participant.name}`}
            className="h-9 w-9 rounded-xl object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot online={participant.online} size={8} />
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{participant.name}</h2>
          <p className="text-[10px] text-muted-foreground">
            {participant.online ? (
              <span className="text-success font-medium">online</span>
            ) : participant.lastSeen ? (
              `visto por último ${participant.lastSeen}`
            ) : (
              "offline"
            )}
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
