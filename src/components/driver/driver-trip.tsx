import { motion } from "framer-motion";
import { Star, MapPin, Navigation2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RideRequest, RideRequestStatus } from "@/lib/driver/driver-types";

interface DriverTripProps {
  ride: RideRequest;
  onAction: (action: string) => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getActionConfig(status: RideRequestStatus): {
  label: string;
  action: string;
  color: string;
} {
  switch (status) {
    case "ACCEPTED":
      return { label: "Cheguei", action: "arrived", color: "bg-amber-500" };
    case "ARRIVED":
      return { label: "Iniciar Corrida", action: "start", color: "bg-primary" };
    case "IN_PROGRESS":
      return { label: "Finalizar", action: "complete", color: "bg-emerald-600" };
    case "COMPLETED":
      return { label: "Avaliar", action: "rate", color: "bg-violet-600" };
    default:
      return { label: "", action: "", color: "bg-muted" };
  }
}

export function DriverTrip({ ride, onAction }: DriverTripProps) {
  const config = getActionConfig(ride.status);

  return (
    <div className="space-y-4">
      <div className="relative h-48 w-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-border overflow-hidden">
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <div className="text-center space-y-1">
            <MapPin className="h-6 w-6 mx-auto text-primary" />
            <p className="text-xs font-medium">Mapa da Viagem</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{ride.passengerName}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {ride.passengerRating.toFixed(1)}
            </span>
          </div>
          <span className="font-display font-bold text-primary">{formatCurrency(ride.price)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-emerald-100 grid place-items-center shrink-0 mt-0.5">
              <MapPin className="h-3 w-3 text-emerald-600" />
            </div>
            <p className="text-xs text-foreground">{ride.origin}</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 grid place-items-center shrink-0 mt-0.5">
              <Navigation2 className="h-3 w-3 text-primary" />
            </div>
            <p className="text-xs text-foreground">{ride.destination}</p>
          </div>
        </div>
      </div>

      {config.action && (
        <motion.button
          key={config.action}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => onAction(config.action)}
          className={cn(
            "w-full h-14 rounded-2xl text-white font-bold text-base active:scale-[0.98] transition-transform shadow-soft",
            config.color,
          )}
        >
          {config.label}
        </motion.button>
      )}
    </div>
  );
}
