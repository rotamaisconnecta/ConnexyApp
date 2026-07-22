import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/driver/driver-utils";
import type { RideRequest } from "@/lib/driver/driver-types";

interface DriverHistoryProps {
  trips: RideRequest[];
  totalEarnings: number;
}

export function DriverHistory({ trips, totalEarnings }: DriverHistoryProps) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-brand p-4 text-white shadow-soft"
      >
        <div className="text-xs opacity-80">Total de Ganhos</div>
        <div className="text-2xl font-bold mt-1">{formatCurrency(totalEarnings)}</div>
        <div className="text-xs opacity-80 mt-1">{trips.length} corridas realizadas</div>
      </motion.div>

      <div className="space-y-2">
        {trips.map((trip, i) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-surface p-3 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={trip.passengerPhoto}
                  alt={trip.passengerName}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-semibold">{trip.passengerName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {trip.origin} → {trip.destination}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-primary">{formatCurrency(trip.price)}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
