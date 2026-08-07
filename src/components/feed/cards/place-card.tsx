import { MapPin, Star, ArrowRight } from "lucide-react";
import { formatDistance } from "@/lib/feed/feed-utils";
import type { FeedItem, PlaceData } from "@/lib/feed/feed-types";

interface PlaceCardProps {
  item: FeedItem;
}

export function PlaceCard({ item }: PlaceCardProps) {
  const d = item.data as PlaceData;

  return (
    <article className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
      <img src={d.cover} alt={d.name} className="h-28 w-full object-cover" />
      <div className="p-3">
        <div className="text-[10px] uppercase font-semibold text-primary">{d.category}</div>
        <h3 className="mt-0.5 font-display text-sm font-bold">{d.name}</h3>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 text-warning fill-warning" />
            {d.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {formatDistance(item.distance)}
          </span>
        </div>
        <button
          type="button"
          className="mt-2 w-full h-8 rounded-xl bg-gradient-brand text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Ver Local <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}
