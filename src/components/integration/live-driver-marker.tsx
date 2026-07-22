/* ==== live-driver-marker.tsx -- Driver marker with availability indicator ==== */

import { motion } from "framer-motion";
import { Car, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionFade } from "@/components/profile/animations";
import { formatDistance, formatEta } from "@/lib/integration/integration-utils";

/* ==== Props ==== */

interface LiveDriverMarkerProps {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  distanceMeters: number;
  etaMinutes?: number;
  isAvailable: boolean;
  online: boolean;
  onSelect: (id: string) => void;
  index?: number;
}

/* ==== Main component ==== */

export function LiveDriverMarker({
  id,
  name,
  vehicle,
  rating,
  distanceMeters,
  etaMinutes,
  isAvailable,
  online,
  onSelect,
  index = 0,
}: LiveDriverMarkerProps) {
  return (
    <motion.div
      variants={sectionFade(index)}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(id)}
      className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface p-3 shadow-soft transition-colors hover:border-brand/30"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white">
            <Car className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface",
              isAvailable ? "bg-emerald-500" : online ? "bg-amber-500" : "bg-gray-400",
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          </div>
          <p className="truncate text-xs text-muted-foreground">{vehicle}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star className="h-3 w-3 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatDistance(distanceMeters)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {etaMinutes !== undefined && (
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              <Clock className="h-2.5 w-2.5" />
              <span>{formatEta(etaMinutes)}</span>
            </div>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              isAvailable
                ? "bg-emerald-100 text-emerald-700"
                : online
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500",
            )}
          >
            {isAvailable ? "Disponível" : online ? "Ocupado" : "Offline"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
