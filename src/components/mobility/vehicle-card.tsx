import { cn } from "@/lib/utils";
import type { VehicleInfo, VehicleCategoryValue } from "@/lib/mobility/ride-types";
import {
  getCategoryLabel,
  getCategoryColor,
  getVehicleSummary,
} from "@/lib/mobility/vehicle-utils";

interface VehicleCardProps {
  vehicle: VehicleInfo;
  selected?: boolean;
  onClick?: () => void;
}

export function VehicleCard({ vehicle, selected = false, onClick }: VehicleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition-all",
        selected
          ? "border-primary bg-accent/60 shadow-soft"
          : "border-border bg-surface hover:bg-accent/30",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 grid place-items-center rounded-xl text-lg",
            getCategoryColor(vehicle.category),
          )}
        >
          {getCategoryLabel(vehicle.category) === "Moto" ? "🏍️" : "🚗"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{vehicle.name}</span>
            <span className="text-[10px] text-muted-foreground">{vehicle.color}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{getVehicleSummary(vehicle)}</div>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            getCategoryColor(vehicle.category),
          )}
        >
          {vehicle.seats} lugares
        </span>
      </div>
    </button>
  );
}
