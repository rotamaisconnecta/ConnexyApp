/* ==== driver-smart-map.tsx -- Smart city map with qualitative indicators ==== */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation2, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CityHotspot, ActivityLevel } from "@/lib/driver/driver-types";
import { driverSection, mapMarkerPop } from "./driver-animations";

/* ==== Props ==== */

interface DriverSmartMapProps {
  hotspots: CityHotspot[];
  driverLat: number;
  driverLng: number;
  onHotspotPress?: (hotspot: CityHotspot) => void;
}

/* ==== Activity level colors for qualitative indicators ==== */

const ACTIVITY_CONFIG: Record<
  ActivityLevel,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  CALMO: {
    label: "Calmo",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  MODERADO: {
    label: "Movimento Moderado",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  EM_ALTA: {
    label: "Movimentado",
    dot: "bg-orange-400",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  BOMBANDO: {
    label: "Bombando",
    dot: "bg-red-400",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  MUITO_CHEIO: {
    label: "Muito cheio",
    dot: "bg-purple-400",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
};

/* ==== Activity level emoji ==== */

const ACTIVITY_EMOJI: Record<ActivityLevel, string> = {
  CALMO: "🟢",
  MODERADO: "🟡",
  EM_ALTA: "🟠",
  BOMBANDO: "🔴",
  MUITO_CHEIO: "🟣",
};

/* ==== Qualitative indicator pill ==== */

function QualitativeIndicator({ level }: { level: ActivityLevel }) {
  const config = ACTIVITY_CONFIG[level];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        config.bg,
        config.text,
        config.border,
      )}
    >
      {ACTIVITY_EMOJI[level]} {config.label}
    </motion.span>
  );
}

/* ==== Hotspot dot on map ==== */

function HotspotDot({
  hotspot,
  index,
  onPress,
}: {
  hotspot: CityHotspot;
  index: number;
  onPress?: () => void;
}) {
  const config = ACTIVITY_CONFIG[hotspot.level];

  return (
    <motion.button
      variants={mapMarkerPop}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.3 }}
      whileTap={{ scale: 0.9 }}
      onClick={onPress}
      className="absolute z-10"
      style={{
        left: `${((hotspot.lng + 43.35) / 0.3) * 100}%`,
        top: `${((hotspot.lat + 23.15) / -0.3) * 100}%`,
      }}
    >
      <div className="relative">
        {hotspot.level === "BOMBANDO" || hotspot.level === "MUITO_CHEIO" ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
        ) : null}
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full shadow-lg",
            config.dot,
          )}
        >
          <span className="text-xs">{hotspot.eventCount > 0 ? "📅" : "📍"}</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ==== Main component ==== */

export function DriverSmartMap({
  hotspots,
  driverLat,
  driverLng,
  onHotspotPress,
}: DriverSmartMapProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<CityHotspot | null>(null);

  return (
    <motion.div
      variants={driverSection(1)}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-100 to-slate-50 shadow-soft">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Map content area */}
        <div className="relative h-48 w-full">
          {/* Hotspot dots */}
          {hotspots.map((hotspot, i) => (
            <HotspotDot
              key={hotspot.id}
              hotspot={hotspot}
              index={i}
              onPress={() => {
                setSelectedHotspot(selectedHotspot?.id === hotspot.id ? null : hotspot);
                onHotspotPress?.(hotspot);
              }}
            />
          ))}

          {/* Driver position */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-30" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
              <Navigation2 className="h-4 w-4" />
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
          {(["BOMBANDO", "EM_ALTA", "MODERADO", "CALMO", "MUITO_CHEIO"] as ActivityLevel[]).map(
            (level) => (
              <QualitativeIndicator key={level} level={level} />
            ),
          )}
        </div>
      </div>

      {/* Selected hotspot details */}
      <AnimatePresence>
        {selectedHotspot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-surface p-3 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ACTIVITY_EMOJI[selectedHotspot.level]}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedHotspot.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedHotspot.category}
                      {selectedHotspot.eventCount > 0 &&
                        ` · ${selectedHotspot.eventCount} evento${selectedHotspot.eventCount > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <QualitativeIndicator level={selectedHotspot.level} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
