import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/mobility/ride-types";
import { getStatusLabel, getStatusBgColor, getProgressPercent } from "@/lib/mobility/ride-status";
import { MapPin } from "lucide-react";

interface TripProgressProps {
  trip: Trip;
}

export function TripProgress({ trip }: TripProgressProps) {
  const progress = getProgressPercent(trip.status);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Progresso
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            getStatusBgColor(trip.status),
          )}
        >
          {getStatusLabel(trip.status)}
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-success" />
          {trip.request.origin.label}
        </div>
        <div className="flex items-center gap-1">
          {trip.request.destination.label}
          <MapPin className="h-3 w-3 text-primary" />
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        ETA: <span className="font-semibold text-foreground">{trip.estimatedArrival}</span>
      </div>
    </div>
  );
}
