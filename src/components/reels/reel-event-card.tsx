import { Calendar, MapPin, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelEvent } from "@/lib/reels/reel-types";

interface ReelEventCardProps {
  event: ReelEvent;
  onOpenEvent: () => void;
  onToggleInterest: () => void;
  onToggleAttending: () => void;
}

export function ReelEventCard({
  event,
  onOpenEvent,
  onToggleInterest,
  onToggleAttending,
}: ReelEventCardProps) {
  const dateStr = new Date(event.date).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "rounded-2xl bg-surface/90 backdrop-blur-xl p-4 border border-border",
        "max-w-[280px]",
      )}
    >
      <button onClick={onOpenEvent} className="text-left w-full">
        <p className="text-sm font-display font-semibold text-foreground truncate">{event.name}</p>
      </button>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {dateStr}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {event.location}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          {event.interestedCount}
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {event.attendingCount}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onToggleInterest}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            event.isInterested
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-secondary text-muted-foreground border border-border",
          )}
        >
          Tenho Interesse
        </button>
        <button
          onClick={onToggleAttending}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            event.isAttending
              ? "bg-gradient-brand text-white"
              : "bg-secondary text-muted-foreground border border-border",
          )}
        >
          Vou Participar
        </button>
      </div>
    </div>
  );
}
