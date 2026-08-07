import { Tag, Building2, Clock } from "lucide-react";
import type { FeedItem, OfferData } from "@/lib/feed/feed-types";

interface OfferCardProps {
  item: FeedItem;
}

export function OfferCard({ item }: OfferCardProps) {
  const d = item.data as OfferData;

  return (
    <article className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
      <img src={d.image} alt={d.title} className="h-28 w-full object-cover" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-bold flex-1">{d.title}</h3>
          <span className="shrink-0 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold text-white">
            {d.discount}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {d.company}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Válido até {d.validUntil}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">Oferta exclusiva</span>
        </div>
      </div>
    </article>
  );
}
