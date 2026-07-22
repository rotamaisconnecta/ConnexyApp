/* ==== live-event-marker.tsx -- Event marker with activity indicators ==== */

import { motion } from "framer-motion";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionFade } from "@/components/profile/animations";
import type { HeatLevelValue } from "@/lib/integration/integration-types";
import { HeatLevel } from "@/lib/integration/integration-types";
import {
  formatDistance,
  formatRelativeTime,
  getHeatColor,
  shouldPulse,
} from "@/lib/integration/integration-utils";

/* ==== Props ==== */

interface LiveEventMarkerProps {
  id: string;
  name: string;
  category: string;
  venue: string;
  startDate: string;
  endDate: string;
  attendeeCount: number;
  distanceMeters: number;
  heatLevel: HeatLevelValue;
  isInterested: boolean;
  isAttending: boolean;
  checkedIn: boolean;
  imageUrl?: string;
  onSelect: (id: string) => void;
  index?: number;
}

/* ==== Status badge ==== */

function EventStatus({
  startDate,
  endDate,
  checkedIn,
}: {
  startDate: string;
  endDate: string;
  checkedIn: boolean;
}) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (checkedIn) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Presente
      </span>
    );
  }

  if (now >= start && now <= end) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        AO VIVO
      </span>
    );
  }

  if (now < start) {
    const remaining = start - now;
    const hr = Math.floor(remaining / 3600000);
    const min = Math.floor((remaining % 3600000) / 60000);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
        <Clock className="h-2.5 w-2.5" />
        em {hr > 0 ? `${hr}h ` : ""}
        {min}min
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
      Encerrado
    </span>
  );
}

/* ==== Main component ==== */

export function LiveEventMarker({
  id,
  name,
  category,
  venue,
  startDate,
  endDate,
  attendeeCount,
  distanceMeters,
  heatLevel,
  isInterested,
  isAttending,
  checkedIn,
  imageUrl,
  onSelect,
  index = 0,
}: LiveEventMarkerProps) {
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
        <div className="relative h-24 w-full overflow-hidden bg-muted">
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-2 left-2">
            <EventStatus startDate={startDate} endDate={endDate} checkedIn={checkedIn} />
          </div>
          <div className="absolute right-2 top-2">
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {category}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-3">
        {!imageUrl && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white">
            <Calendar className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{venue}</span>
          </div>

          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{attendeeCount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{formatDistance(distanceMeters)}</span>
            </div>
          </div>

          {!imageUrl && (
            <div className="mt-1.5">
              <EventStatus startDate={startDate} endDate={endDate} checkedIn={checkedIn} />
            </div>
          )}
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
