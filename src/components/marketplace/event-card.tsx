import { Calendar, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessEvent } from "@/lib/marketplace/business-types";
import {
  getEventStatusLabel,
  getEventStatusBgColor,
  formatEventDate,
  formatEventTime,
  formatAttendeesCount,
} from "@/lib/marketplace/event-utils";

interface EventCardProps {
  event: BusinessEvent;
  onSelect?: (id: string) => void;
}

export function EventCard({ event, onSelect }: EventCardProps) {
  return (
    <button
      onClick={() => onSelect?.(event.id)}
      aria-label={`Ver evento ${event.title}`}
      className="w-full text-left rounded-2xl bg-surface border border-border/50 overflow-hidden shadow-soft transition-all active:scale-[0.98]"
    >
      {event.photo && (
        <div className="h-32 overflow-hidden">
          <img src={event.photo} alt={event.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              getEventStatusBgColor(event.status),
            )}
          >
            {getEventStatusLabel(event.status)}
          </span>
          {event.isFeatured && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/15 text-amber">
              Destaque
            </span>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
        <p className="text-[11px] text-muted-foreground line-clamp-2">{event.description}</p>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatEventDate(event.startDate)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatEventTime(event.startDate)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {formatAttendeesCount(event.attendeesCount)}
          </div>
          {event.price !== undefined && (
            <span className="text-sm font-semibold">
              {event.price === 0 ? "Grátis" : `R$ ${event.price.toFixed(2).replace(".", ",")}`}
            </span>
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {event.location}
          </div>
        )}
      </div>
    </button>
  );
}
