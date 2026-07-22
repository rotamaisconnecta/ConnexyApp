/* ==== live-place-marker.tsx -- Place marker with qualitative status ==== */

import { motion } from "framer-motion";
import { MapPin, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionFade } from "@/components/profile/animations";
import type { PlaceStatusValue, HeatLevelValue } from "@/lib/integration/integration-types";
import {
  formatDistance,
  getPlaceStatusColor,
  getPlaceStatusBg,
  getPlaceStatusBorder,
  getHeatColor,
  shouldPulse,
} from "@/lib/integration/integration-utils";
import { PlaceStatusMeta } from "@/lib/integration/integration-types";

/* ==== Props ==== */

interface LivePlaceMarkerProps {
  id: string;
  name: string;
  category: string;
  status: PlaceStatusValue;
  rating?: number;
  checkinCount: number;
  distanceMeters: number;
  heatLevel: HeatLevelValue;
  isFavorite: boolean;
  imageUrl?: string;
  onSelect: (id: string) => void;
  index?: number;
}

/* ==== Main component ==== */

export function LivePlaceMarker({
  id,
  name,
  category,
  status,
  rating,
  checkinCount,
  distanceMeters,
  heatLevel,
  isFavorite,
  imageUrl,
  onSelect,
  index = 0,
}: LivePlaceMarkerProps) {
  const statusColor = getPlaceStatusColor(status);
  const statusBg = getPlaceStatusBg(status);
  const statusBorder = getPlaceStatusBorder(status);
  const heatColor = getHeatColor(heatLevel);
  const pulse = shouldPulse(heatLevel);

  return (
    <motion.div
      variants={sectionFade(index)}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(id)}
      className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-colors hover:border-brand/30"
    >
      {imageUrl && (
        <div className="relative h-20 w-full overflow-hidden bg-muted">
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {isFavorite && (
            <div className="absolute right-2 top-2">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 p-3">
        {!imageUrl && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
            <MapPin className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            {!imageUrl && isFavorite && (
              <Heart className="h-3 w-3 flex-shrink-0 fill-red-500 text-red-500" />
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>

          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                statusBg,
                statusColor,
                statusBorder,
              )}
            >
              {PlaceStatusMeta[status].emoji} {PlaceStatusMeta[status].label}
            </span>

            {rating !== undefined && (
              <div className="flex items-center gap-0.5 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{checkinCount} check-ins</span>
            <span>{formatDistance(distanceMeters)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="relative flex h-2 w-2">
            {pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  heatColor,
                )}
              />
            )}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", heatColor)} />
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatDistance(distanceMeters)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
