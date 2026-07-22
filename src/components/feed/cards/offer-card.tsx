import { Tag, Building2, Clock } from "lucide-react";
import type { FeedItem, OfferData } from "@/lib/feed/feed-types";

interface OfferCardProps {
  item: FeedItem;
}

export function OfferCard({ item }: OfferCardProps) {
  const d = item.data as OfferData;

  return (
    <article className="rounded-3xl border border-border bg-surface shadow-soft overflow-hidden">
      <img src={d.image} alt={d.title} className="h-40 w-full object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold flex-1">{d.title}</h3>
          <span className="shrink-0 rounded-full bg-gradient-brand px-2.5 py-1 text-[11px] font-bold text-white">
            {d.discount}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {d.company}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Válido até {d.validUntil}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Oferta exclusiva</span>
        </div>
      </div>
    </article>
  );
}
