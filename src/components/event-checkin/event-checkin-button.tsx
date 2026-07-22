import { motion } from "framer-motion";
import { MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckinStatus } from "@/lib/event-checkin/checkin-types";
import { CheckinStatus as Status } from "@/lib/event-checkin/checkin-types";

interface EventCheckinButtonProps {
  status: CheckinStatus;
  distanceMeters: number;
  radius: number;
  onCheckIn: () => void;
  loading?: boolean;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function EventCheckinButton({
  status,
  distanceMeters,
  radius,
  onCheckIn,
  loading = false,
}: EventCheckinButtonProps) {
  const isWithinRadius = distanceMeters <= radius;
  const isCheckedIn = status === Status.CHECKED_IN;

  if (isCheckedIn) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-6 py-4">
        <Check className="h-5 w-5 text-emerald-600" />
        <span className="font-semibold text-emerald-700">Presente Agora</span>
      </div>
    );
  }

  if (!isWithinRadius) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-6 py-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">{formatDistance(distanceMeters)} de distância</span>
        </div>
        <p className="text-xs text-muted-foreground">Aproxime-se do evento para fazer check-in</p>
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onCheckIn}
      disabled={loading}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold text-white transition-colors",
        "bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF] shadow-[0_4px_16px_rgba(108,59,255,0.35)]",
        loading && "pointer-events-none opacity-70",
      )}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-white/20"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <MapPin className="relative h-5 w-5" />
      <span className="relative">{loading ? "Verificando..." : "Fazer Check-in"}</span>
    </motion.button>
  );
}
