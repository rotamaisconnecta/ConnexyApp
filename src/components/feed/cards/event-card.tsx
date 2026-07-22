import { Calendar, Clock, Users } from "lucide-react";
import { formatNumber } from "@/lib/feed/feed-utils";
import type { FeedItem, EventData } from "@/lib/feed/feed-types";

interface EventCardProps {
  item: FeedItem;
}

export function EventCard({ item }: EventCardProps) {
  const d = item.data as EventData;

  return (
    <article className="rounded-3xl border border-border bg-surface shadow-soft overflow-hidden">
      <img src={d.banner} alt={d.name} className="h-40 w-full object-cover" />
      <div className="p-4">
        <h3 className="font-display text-base font-bold">{d.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {d.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {d.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(d.participants)} participantes
          </span>
        </div>
        <button
          type="button"
          className="mt-3 w-full h-9 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-soft transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Participar
        </button>
      </div>
    </article>
  );
}
