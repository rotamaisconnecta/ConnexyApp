import { MapPin, ExternalLink, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelLocation } from "@/lib/reels/reel-types";
import { formatDistance } from "@/lib/reels/reel-utils";

interface ReelPlaceCardProps {
  location: ReelLocation;
  onOpenPlace: () => void;
  onRequestRide: () => void;
}

export function ReelPlaceCard({ location, onOpenPlace, onRequestRide }: ReelPlaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface/90 backdrop-blur-xl p-4 border border-border",
        "max-w-[280px]",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-green-500/15">
          <MapPin className="h-4 w-4 text-green-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{location.name}</p>
          <p className="text-xs text-muted-foreground truncate">{location.address}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              {location.category}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistance(location.distanceMeters)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onOpenPlace}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground border border-border"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver Local
        </button>
        <button
          onClick={onRequestRide}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand px-3 py-2 text-xs font-semibold text-white"
        >
          <Car className="h-3.5 w-3.5" />
          Pedir Corrida
        </button>
      </div>
    </div>
  );
}
