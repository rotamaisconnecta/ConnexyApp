import { Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RideHistoryItem } from "@/lib/mobility/ride-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { formatDistance, formatDuration, formatRideDate } from "@/lib/mobility/ride-utils";
import { getCategoryLabel, getCategoryIcon, getCategoryColor } from "@/lib/mobility/vehicle-utils";

interface RideHistoryCardProps {
  item: RideHistoryItem;
  onClick?: (id: string) => void;
}

export function RideHistoryCard({ item, onClick }: RideHistoryCardProps) {
  return (
    <button
      onClick={() => onClick?.(item.id)}
      className="w-full rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex items-start gap-3">
        <img
          src={item.driverPhoto}
          alt={item.driverName}
          className="h-10 w-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{item.driverName}</span>
            <span className="font-display font-bold text-sm">{formatPrice(item.price)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                getCategoryColor(item.category),
              )}
            >
              {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
            </span>
            {item.rating && (
              <span className="text-[11px] flex items-center gap-0.5 text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {item.rating}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {item.origin.label} → {item.destination.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{formatDistance(item.distanceMeters)}</span>
            <span>{formatDuration(item.durationMinutes)}</span>
            <span>{formatRideDate(item.completedAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
