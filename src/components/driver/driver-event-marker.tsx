/* ==== driver-event-marker.tsx -- Premium event markers with PlaceStatus indicators ==== */

import { motion } from "framer-motion";
import { Calendar, Users, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriverEvent } from "@/lib/driver/driver-types";
import { PlaceStatus, type PlaceStatusValue } from "@/lib/integration/integration-types";
import { driverSection, cardHover, buttonTap } from "./driver-animations";

/* ==== Props ==== */

interface DriverEventMarkerProps {
  event: DriverEvent;
  onNavigate?: (eventId: string) => void;
  index?: number;
}

/* ==== Activity to PlaceStatus mapping ==== */

const ACTIVITY_TO_STATUS: Record<string, PlaceStatusValue> = {
  CALMO: PlaceStatus.CALMO,
  MODERADO: PlaceStatus.MOVIMENTADO,
  EM_ALTA: PlaceStatus.BOMBANDO,
  BOMBANDO: PlaceStatus.MUITO_CHEIO,
  MUITO_CHEIO: PlaceStatus.EVENTO_ACONTECENDO,
};

/* ==== Status pill ==== */

function StatusPill({ level }: { level: string }) {
  const status = ACTIVITY_TO_STATUS[level] ?? PlaceStatus.CALMO;
  const meta = {
    [PlaceStatus.CALMO]: {
      label: "Calmo",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      emoji: "😌",
    },
    [PlaceStatus.MOVIMENTADO]: {
      label: "Movimentado",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      emoji: "👥",
    },
    [PlaceStatus.BOMBANDO]: {
      label: "Bombando",
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      emoji: "🔥",
    },
    [PlaceStatus.MUITO_CHEIO]: {
      label: "Muito cheio",
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      emoji: "🟣",
    },
    [PlaceStatus.EVENTO_ACONTECENDO]: {
      label: "Evento acontecendo",
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      emoji: "🎉",
    },
  };

  const config = meta[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        config.bg,
        config.color,
        config.border,
      )}
    >
      {config.emoji} {config.label}
    </span>
  );
}

/* ==== Main component ==== */

export function DriverEventMarker({ event, onNavigate, index = 0 }: DriverEventMarkerProps) {
  return (
    <motion.div
      variants={driverSection(index)}
      initial="hidden"
      animate="visible"
      {...cardHover}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
    >
      {/* Header with status */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{event.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {event.category} · {event.distance} km
            </p>
          </div>
        </div>
        <StatusPill level={event.level} />
      </div>

      {/* Status text */}
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">{event.status}</p>
      </div>

      {/* Action */}
      <div className="border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={() => onNavigate?.(event.id)}
          {...buttonTap}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Navigation className="h-3.5 w-3.5" />
          Navegar até o evento
        </button>
      </div>
    </motion.div>
  );
}
