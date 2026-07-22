import { Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriverMatch } from "@/lib/mobility/ride-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { formatEta } from "@/lib/mobility/eta-utils";
import { formatDistance } from "@/lib/mobility/ride-utils";
import { getCategoryLabel, getCategoryIcon } from "@/lib/mobility/vehicle-utils";

interface DriverCardProps {
  driver: DriverMatch;
  onSelect?: (driver: DriverMatch) => void;
  onToggleFavorite?: (driverId: string) => void;
  selected?: boolean;
}

export function DriverCard({
  driver,
  onSelect,
  onToggleFavorite,
  selected = false,
}: DriverCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-all flex items-center gap-3",
        selected ? "border-primary bg-accent/60 shadow-soft" : "border-border bg-surface",
      )}
    >
      <img src={driver.photo} alt={driver.name} className="h-14 w-14 rounded-full object-cover" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{driver.name}</span>
          <span className="text-[11px] flex items-center gap-0.5 text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {driver.rating}
          </span>
          <span className="text-[11px] text-muted-foreground">({driver.totalRides})</span>
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span>{getCategoryIcon(driver.vehicle.category)}</span>
          <span>
            {driver.vehicle.name} · {driver.vehicle.plate}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {formatEta(driver.etaMinutes)} · {formatDistance(driver.distanceMeters)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="font-display font-bold text-sm">
          {formatPrice(driver.priceEstimate.finalPrice)}
        </span>
        {onSelect && (
          <button
            onClick={() => onSelect(driver)}
            className="rounded-full bg-gradient-brand text-white text-[11px] font-semibold px-3 py-1"
          >
            Solicitar
          </button>
        )}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(driver.id)}
            aria-label={driver.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                driver.isFavorite ? "fill-pink text-pink" : "text-muted-foreground",
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}
