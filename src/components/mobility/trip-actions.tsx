import { Shield, Share2, MessageCircle, X } from "lucide-react";
import type { RideStatusValue } from "@/lib/mobility/ride-types";
import { canCancel, canShare } from "@/lib/mobility/ride-status";

interface TripActionsProps {
  status: RideStatusValue;
  onShare?: () => void;
  onSOS?: () => void;
  onCancel?: () => void;
  onMessage?: () => void;
}

export function TripActions({ status, onShare, onSOS, onCancel, onMessage }: TripActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {canShare(status) && onShare && (
        <button
          onClick={onShare}
          className="flex-1 h-11 grid place-items-center rounded-xl bg-secondary gap-1.5"
          aria-label="Compartilhar viagem"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-[11px] font-medium">Compartilhar</span>
        </button>
      )}

      {onMessage && (
        <button
          onClick={onMessage}
          className="flex-1 h-11 grid place-items-center rounded-xl bg-secondary gap-1.5"
          aria-label="Mensagem"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-[11px] font-medium">Mensagem</span>
        </button>
      )}

      {onSOS && (
        <button
          onClick={onSOS}
          className="h-11 w-11 grid place-items-center rounded-xl bg-destructive/15 text-destructive shrink-0"
          aria-label="Emergência SOS"
        >
          <Shield className="h-4 w-4" />
        </button>
      )}

      {canCancel(status) && onCancel && (
        <button
          onClick={onCancel}
          className="h-11 w-11 grid place-items-center rounded-xl bg-secondary text-destructive shrink-0"
          aria-label="Cancelar viagem"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
