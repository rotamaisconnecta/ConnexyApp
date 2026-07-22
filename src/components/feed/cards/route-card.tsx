import { MapPin, Clock, Car } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import type { FeedItem, RouteData } from "@/lib/feed/feed-types";

interface RouteCardProps {
  item: FeedItem;
}

export function RouteCard({ item }: RouteCardProps) {
  const d = item.data as RouteData;

  return (
    <article className="rounded-3xl border border-border bg-surface shadow-soft p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={d.driver.photo}
            alt={`Foto de ${d.driver.name}`}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot online={d.driver.online ?? false} size={10} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{d.driver.name}</div>
          <div className="text-[11px] text-muted-foreground">Motorista</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-primary">
            {d.seatsAvailable} vaga{d.seatsAvailable !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div className="h-8 w-px bg-border" />
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{d.origin}</div>
          <div className="text-sm font-semibold truncate mt-2">{d.destination}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {d.departureTime}
        </span>
        <span className="inline-flex items-center gap-1">
          <Car className="h-3.5 w-3.5" />
          {d.driver.name}
        </span>
      </div>
    </article>
  );
}
