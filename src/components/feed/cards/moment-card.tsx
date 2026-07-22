import { MapPin, Clock } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { formatRemainingTime } from "@/lib/feed/feed-utils";
import type { FeedItem, MomentData } from "@/lib/feed/feed-types";

interface MomentCardProps {
  item: FeedItem;
}

export function MomentCard({ item }: MomentCardProps) {
  const d = item.data as MomentData;
  const remaining = formatRemainingTime(d.expiresAt);

  return (
    <article className="rounded-3xl border border-success/30 bg-surface shadow-soft p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={item.author.photo}
            alt={`Foto de ${item.author.name}`}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot online size={10} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{item.author.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {remaining}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success border border-success/30 px-2.5 py-0.5 text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          AGORA
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-snug">
        {d.emoji} {d.text}
      </p>

      {d.placeName && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {d.placeName}
        </div>
      )}
    </article>
  );
}
