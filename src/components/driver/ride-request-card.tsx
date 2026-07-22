import { motion } from "framer-motion";
import { Star, MapPin, Navigation2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RideRequest } from "@/lib/driver/driver-types";

interface RideRequestCardProps {
  request: RideRequest;
  onAccept: () => void;
  onDecline: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}min`;
}

export function RideRequestCard({ request, onAccept, onDecline }: RideRequestCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={request.passengerPhoto}
            alt={request.passengerName}
            className="h-12 w-12 rounded-full object-cover border-2 border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {request.passengerName}
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {request.passengerRating.toFixed(1)}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display font-bold text-lg text-primary">
              {formatCurrency(request.price)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground">{request.origin}</p>
          </div>
          <div className="flex items-start gap-2">
            <Navigation2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground">{request.destination}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{formatDistance(request.distance)}</span>
          <span>•</span>
          <span>{formatDuration(request.duration)}</span>
        </div>
      </div>

      <div className="flex border-t border-border">
        <button
          onClick={onDecline}
          className="flex-1 py-3.5 text-sm font-semibold text-red-500 active:bg-red-50 transition-colors"
        >
          Recusar
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={onAccept}
          className="flex-1 py-3.5 text-sm font-semibold text-emerald-600 active:bg-emerald-50 transition-colors"
        >
          Aceitar
        </button>
      </div>
    </motion.div>
  );
}
