import { motion } from "framer-motion";
import {
  getActivityEmoji,
  getActivityColor,
  getActivityDescription,
} from "@/lib/driver/driver-hotspots";
import type { CityHotspot } from "@/lib/driver/driver-types";

interface CityHotspotsProps {
  hotspots: CityHotspot[];
  className?: string;
}

export function CityHotspots({ hotspots, className }: CityHotspotsProps) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">🔥</span>
        <h3 className="font-display font-bold text-sm">Mapa da Cidade</h3>
      </div>

      <div className="relative h-44 rounded-2xl bg-gradient-to-br from-blue-50 to-green-50 border border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        {hotspots.map((spot, i) => {
          const x = (((spot.lng + 46.6) * 800) % 90) + 5;
          const y = (((spot.lat + 23.5) * 600) % 80) + 10;
          return (
            <motion.div
              key={spot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, type: "spring", damping: 15 }}
              className="absolute flex flex-col items-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="text-lg drop-shadow-md">{getActivityEmoji(spot.level)}</span>
              <span className="text-[8px] font-semibold bg-white/90 rounded-full px-1.5 py-0.5 shadow-sm whitespace-nowrap">
                {spot.name}
              </span>
            </motion.div>
          );
        })}

        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
          <LegendItem emoji="🔥" label="Bombando" />
          <LegendItem emoji="🎉" label="Evento" />
          <LegendItem emoji="🚖" label="Corridas" />
          <LegendItem emoji="📍" label="Parceiros" />
        </div>
      </div>

      <div className="space-y-1.5">
        {hotspots.slice(0, 5).map((spot, i) => (
          <motion.div
            key={spot.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl bg-surface border border-border px-3 py-2"
          >
            <span className="text-lg">{getActivityEmoji(spot.level)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{spot.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {getActivityDescription(spot.level)}
              </div>
            </div>
            <span className={`text-[10px] font-semibold ${getActivityColor(spot.level)}`}>
              {spot.eventCount} eventos
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold shadow-sm">
      <span>{emoji}</span>
      {label}
    </span>
  );
}
