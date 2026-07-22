import { MapPin, Star, ArrowRight } from "lucide-react";
import { formatDistance } from "@/lib/feed/feed-utils";
import type { FeedItem, PlaceData } from "@/lib/feed/feed-types";

interface PlaceCardProps {
  item: FeedItem;
}

export function PlaceCard({ item }: PlaceCardProps) {
  const d = item.data as PlaceData;

  return (
    <article className="rounded-3xl border border-border bg-surface shadow-soft overflow-hidden">
      <img src={d.cover} alt={d.name} className="h-40 w-full object-cover" />
      <div className="p-4">
        <div className="text-[10px] uppercase font-semibold text-primary">{d.category}</div>
        <h3 className="mt-0.5 font-display text-base font-bold">{d.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            {d.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {formatDistance(item.distance)}
          </span>
        </div>
        <button
          type="button"
          className="mt-3 w-full h-9 rounded-xl bg-gradient-brand text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Ver Local <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
