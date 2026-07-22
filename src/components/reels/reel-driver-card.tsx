import { Star, Car, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelDriver } from "@/lib/reels/reel-types";

interface ReelDriverCardProps {
  driver: ReelDriver;
  onRequestRide: () => void;
  onViewProfile: () => void;
}

export function ReelDriverCard({ driver, onRequestRide, onViewProfile }: ReelDriverCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface/90 backdrop-blur-xl p-4 border border-border",
        "max-w-[280px]",
      )}
    >
      <div className="flex items-center gap-3">
        <button onClick={onViewProfile} className="shrink-0">
          <img
            src={driver.photo}
            alt={driver.name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
          />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={onViewProfile} className="text-left">
            <p className="truncate text-sm font-semibold text-foreground">{driver.name}</p>
          </button>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-foreground">{driver.rating}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Car className="h-3.5 w-3.5" />
          <span>{driver.vehicle}</span>
          <span className="font-mono text-[10px] bg-secondary rounded px-1.5 py-0.5">
            {driver.plate}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>ETA: {driver.etaMinutes} min</span>
        </div>
      </div>
      <button
        onClick={onRequestRide}
        disabled={!driver.isAvailable}
        className={cn(
          "mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors",
          driver.isAvailable
            ? "bg-gradient-brand text-white"
            : "bg-secondary text-muted-foreground border border-border opacity-50 cursor-not-allowed",
        )}
      >
        {driver.isAvailable ? "Solicitar Corrida" : "Indisponível"}
      </button>
    </div>
  );
}
