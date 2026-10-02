import { ChevronLeft, Copy, Download, Phone, Search, Trash2, Video, MoreVertical } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationParticipant } from "@/lib/chat/chat-types";
import { selectedCountLabel } from "@/lib/chat/chat-selection";

interface ChatHeaderProps {
  participant: ConversationParticipant;
  proximity?: string;
  onBack: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: () => void;
  onMenu?: () => void;
  subtitle?: string;
  selecting?: boolean;
  selectedCount?: number;
  onCancelSelection?: () => void;
  onCopySelected?: () => void;
  onDeleteSelected?: () => void;
  onDownloadSelected?: () => void;
  canCopySelected?: boolean;
  canDeleteSelected?: boolean;
  canDownloadSelected?: boolean;
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
  subtitle,
  selecting = false,
  selectedCount = 0,
  onCancelSelection,
  onCopySelected,
  onDeleteSelected,
  onDownloadSelected,
  canCopySelected = false,
  canDeleteSelected = false,
  canDownloadSelected = false,
}: ChatHeaderProps) {
  if (selecting) {
    return (
      <header className="flex items-center gap-1.5 bg-transparent px-2.5 pb-2 pt-1">
        <button
          type="button"
          onClick={onCancelSelection}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70"
          aria-label="Cancelar seleção"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-[15px] font-semibold tracking-tight">
            {selectedCountLabel(selectedCount)}
          </h2>
          <p className="truncate text-[11px] text-muted-foreground">{participant.name}</p>
        </div>
        <button
          type="button"
          onClick={onCopySelected}
          disabled={!canCopySelected}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70 disabled:opacity-30"
          aria-label="Copiar"
        >
          <Copy className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={onDownloadSelected}
          disabled={!canDownloadSelected}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70 disabled:opacity-30"
          aria-label="Baixar selecionadas"
        >
          <Download className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!canDeleteSelected}
          className="grid h-10 w-10 place-items-center rounded-full text-destructive transition-colors hover:bg-white/70 disabled:opacity-30"
          aria-label="Excluir"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </header>
    );
  }

  const status =
    subtitle ??
    (participant.online
      ? "Online agora"
      : participant.lastSeen
        ? `visto por último ${participant.lastSeen}`
        : "Offline");

  return (
    <header className="flex items-center gap-1.5 bg-transparent px-2.5 pb-2 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        aria-label={`Perfil de ${participant.name}`}
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage
              src={participant.photo}
              alt={`Foto de ${participant.name}`}
              className="rounded-full"
            />
            <AvatarFallback className="rounded-full bg-gradient-brand text-[11px] font-bold text-white">
              {getInitials(participant.name)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot online={participant.online} size={8} />
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-[15px] font-semibold tracking-tight">
            {participant.name}
          </h2>
          <p
            className={cn(
              "truncate text-[11px]",
              participant.online ? "font-medium text-success" : "text-muted-foreground",
            )}
          >
            {status}
            {proximity ? (
              <span className={cn(!participant.online && "font-normal text-muted-foreground")}>
                {" · "}
                {proximity}
              </span>
            ) : null}
          </p>
        </div>
      </button>

      <div className="flex items-center">
        {onCall && (
          <button
            type="button"
            onClick={onCall}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70"
            aria-label="Ligar"
          >
            <Phone className="h-[18px] w-[18px]" />
          </button>
        )}
        {onVideoCall && (
          <button
            type="button"
            onClick={onVideoCall}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70"
            aria-label="Videocall"
          >
            <Video className="h-[18px] w-[18px]" />
          </button>
        )}
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70"
            aria-label="Buscar na conversa"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        )}
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/70"
            aria-label="Mais opções"
          >
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </header>
  );
}
