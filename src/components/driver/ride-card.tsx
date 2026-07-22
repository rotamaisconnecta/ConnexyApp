import { motion } from "framer-motion";
import { Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RideRequest, RideRequestStatus } from "@/lib/driver/driver-types";

interface RideCardProps {
  ride: RideRequest;
  status: RideRequestStatus;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const STEPS = [
  { key: "ARRIVED" as const, label: "Cheguei" },
  { key: "IN_PROGRESS" as const, label: "Iniciar" },
  { key: "COMPLETED" as const, label: "Finalizar" },
] as const;

const stepOrder: RideRequestStatus[] = ["ACCEPTED", "ARRIVED", "IN_PROGRESS", "COMPLETED"];

function getActiveStepIndex(status: RideRequestStatus): number {
  if (status === "CANCELLED") return -1;
  const idx = stepOrder.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function RideCard({ ride, status }: RideCardProps) {
  const activeIdx = getActiveStepIndex(status);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={ride.passengerPhoto}
            alt={ride.passengerName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm text-foreground">{ride.passengerName}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {ride.passengerRating.toFixed(1)}
            </span>
          </div>
        </div>
        <span className="font-display font-bold text-primary">{formatCurrency(ride.price)}</span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>De: {ride.origin}</p>
        <p>Para: {ride.destination}</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isCompleted = activeIdx > i;
          const isCurrent = activeIdx === i;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center flex-1 gap-1.5">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold transition-colors",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full mt-[-18px]",
                    activeIdx > i ? "bg-emerald-400" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
