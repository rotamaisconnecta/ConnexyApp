/* ==== live-map-layer.tsx -- Live map layer with all integration markers ==== */

import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  Car,
  Calendar,
  Store,
  Tag,
  Film,
  Sparkles,
  Star,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionFade, chipContainer, chipItem, cardSpring } from "@/components/profile/animations";
import type {
  MapMarker,
  MapMarkerTypeValue,
  HeatLevelValue,
  PlaceStatusValue,
} from "@/lib/integration/integration-types";
import { MapMarkerType, HeatLevel } from "@/lib/integration/integration-types";
import {
  formatDistance,
  getHeatColor,
  shouldPulse,
  getPlaceStatusEmoji,
  getMarkerTypeEmoji,
} from "@/lib/integration/integration-utils";

/* ==== Props ==== */

interface LiveMapLayerProps {
  markers: MapMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (id: string) => void;
  visibleTypes: MapMarkerTypeValue[];
  onToggleType: (type: MapMarkerTypeValue) => void;
  userLat: number;
  userLng: number;
  className?: string;
}

/* ==== Type filter config ==== */

const TYPE_CONFIG: Record<
  MapMarkerTypeValue,
  { icon: typeof MapPin; label: string; color: string }
> = {
  PERSON: { icon: Users, label: "Pessoas", color: "bg-blue-500" },
  DRIVER: { icon: Car, label: "Motoristas", color: "bg-green-500" },
  EVENT: { icon: Calendar, label: "Eventos", color: "bg-purple-500" },
  BUSINESS: { icon: Store, label: "Comércios", color: "bg-amber-500" },
  OFFER: { icon: Tag, label: "Ofertas", color: "bg-red-500" },
  REEL: { icon: Film, label: "Reels", color: "bg-pink-500" },
  MOMENT: { icon: Sparkles, label: "Momentos", color: "bg-cyan-500" },
  PLACE: { icon: Star, label: "Locais", color: "bg-orange-500" },
};

/* ==== Heat dot component ==== */

function HeatDot({ level }: { level: HeatLevelValue }) {
  const color = getHeatColor(level);
  const pulse = shouldPulse(level);

  return (
    <span className="relative flex h-2 w-2">
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            color,
          )}
        />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

/* ==== Place status badge ==== */

function PlaceStatusBadge({ status }: { status: PlaceStatusValue }) {
  const emoji = getPlaceStatusEmoji(status);

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      <span>{emoji}</span>
      <span>{status.replace(/_/g, " ")}</span>
    </span>
  );
}

/* ==== Marker card ==== */

function MarkerCard({
  marker,
  isSelected,
  onSelect,
  index,
}: {
  marker: MapMarker;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
}) {
  const config = TYPE_CONFIG[marker.type];
  const Icon = config.icon;

  return (
    <motion.div
      variants={sectionFade(index)}
      initial="hidden"
      animate="visible"
      exit="hidden"
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(marker.id)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
        isSelected ? "border-brand bg-brand/5" : "border-border bg-surface hover:border-brand/30",
      )}
    >
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            config.color,
            "text-white",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="absolute -right-1 -top-1">
          <HeatDot level={marker.heatLevel} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">{marker.title}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{marker.subtitle}</p>
        {marker.placeStatus && (
          <div className="mt-1">
            <PlaceStatusBadge status={marker.placeStatus} />
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">
          {formatDistance(marker.distanceMeters)}
        </span>
        {marker.trending === "UP" && (
          <span className="text-[10px] text-emerald-500">↗ trending</span>
        )}
      </div>
    </motion.div>
  );
}

/* ==== Main component ==== */

export function LiveMapLayer({
  markers,
  selectedMarkerId,
  onSelectMarker,
  visibleTypes,
  onToggleType,
  userLat,
  userLng,
  className,
}: LiveMapLayerProps) {
  const visibleMarkers = markers.filter((m) => visibleTypes.includes(m.type));
  const sortedMarkers = [...visibleMarkers].sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Type filters */}
      <motion.div
        variants={chipContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-1.5"
      >
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const markerType = type as MapMarkerTypeValue;
          const isActive = visibleTypes.includes(markerType);
          const Icon = config.icon;

          return (
            <motion.button
              key={type}
              variants={chipItem}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggleType(markerType)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-brand text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{config.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Markers list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {sortedMarkers.map((marker, i) => (
            <MarkerCard
              key={marker.id}
              marker={marker}
              isSelected={selectedMarkerId === marker.id}
              onSelect={onSelectMarker}
              index={i}
            />
          ))}
        </AnimatePresence>

        {sortedMarkers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-8">
            <MapPin className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum marker no mapa</p>
          </div>
        )}
      </div>
    </div>
  );
}
