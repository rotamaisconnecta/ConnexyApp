import { Calendar, Clock, Users } from "lucide-react";
import { formatNumber } from "@/lib/feed/feed-utils";
import type { FeedItem, EventData } from "@/lib/feed/feed-types";

interface EventCardProps {
  item: FeedItem;
}

export function EventCard({ item }: EventCardProps) {
  const d = item.data as EventData;

  return (
    <article className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
      <img src={d.banner} alt={d.name} className="h-28 w-full object-cover" />
      <div className="p-3">
        <h3 className="font-display text-sm font-bold">{d.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {d.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {d.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formatNumber(d.participants)} participantes
          </span>
        </div>
        <button
          type="button"
          className="mt-2 w-full h-8 rounded-xl bg-gradient-brand text-white text-[11px] font-semibold shadow-soft transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Participar
        </button>
      </div>
    </article>
  );
}
