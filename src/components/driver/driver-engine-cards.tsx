/* ==== driver-engine-cards.tsx -- Engine recommendation cards for drivers ==== */

import { motion } from "framer-motion";
import { MapPin, Calendar, Store, Film, Navigation2, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recommendation, RecommendationTypeValue } from "@/lib/engine/engine-types";
import { driverSection, cardHover } from "./driver-animations";

/* ==== Props ==== */

interface DriverEngineCardsProps {
  recommendations: Recommendation[];
  onCardPress?: (id: string) => void;
}

/* ==== Type config ==== */

const TYPE_CONFIG: Record<
  RecommendationTypeValue,
  { icon: typeof MapPin; color: string; bg: string; label: string }
> = {
  PERSON: { icon: Star, color: "text-violet-600", bg: "bg-violet-50", label: "Pessoa" },
  EVENT: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", label: "Evento" },
  BUSINESS: { icon: Store, color: "text-amber-600", bg: "bg-amber-50", label: "Negócio" },
  PLACE: { icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50", label: "Lugar" },
  OFFER: { icon: Store, color: "text-rose-600", bg: "bg-rose-50", label: "Oferta" },
  REEL: { icon: Film, color: "text-purple-600", bg: "bg-purple-50", label: "Reel" },
  DRIVER: { icon: Navigation2, color: "text-primary", bg: "bg-primary/10", label: "Motorista" },
  ROUTE: { icon: Navigation2, color: "text-cyan-600", bg: "bg-cyan-50", label: "Rota" },
  NETWORKING: { icon: Star, color: "text-indigo-600", bg: "bg-indigo-50", label: "Networking" },
};

/* ==== Activity level colors ==== */

const ACTIVITY_COLORS: Record<string, string> = {
  CALMO: "bg-emerald-400",
  MODERADO: "bg-amber-400",
  EM_ALTA: "bg-orange-400",
  BOMBANDO: "bg-red-400",
  MUITO_CHEIO: "bg-purple-400",
};

/* ==== Engine card ==== */

function EngineCard({
  rec,
  index,
  onPress,
}: {
  rec: Recommendation;
  index: number;
  onPress?: () => void;
}) {
  const config = TYPE_CONFIG[rec.type];
  const Icon = config.icon;
  const distance =
    rec.distanceMeters >= 1000
      ? `${(rec.distanceMeters / 1000).toFixed(1)} km`
      : `${Math.round(rec.distanceMeters)} m`;

  return (
    <motion.button
      variants={driverSection(index)}
      initial="hidden"
      animate="visible"
      {...cardHover}
      onClick={onPress}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left shadow-soft"
    >
      {/* Icon */}
      <div
        className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", config.bg)}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{rec.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{rec.subtitle}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{distance}</span>
          {rec.trending && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
              <TrendingUp className="h-2.5 w-2.5" /> Alta
            </span>
          )}
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              ACTIVITY_COLORS[rec.activityLevel] ?? "bg-gray-400",
            )}
          />
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p className="text-xs font-bold text-primary">{Math.round(rec.score.total * 100)}%</p>
        <p className="text-[9px] text-muted-foreground">match</p>
      </div>
    </motion.button>
  );
}

/* ==== Main component ==== */

export function DriverEngineCards({ recommendations, onCardPress }: DriverEngineCardsProps) {
  const topRecs = recommendations.slice(0, 6);

  if (topRecs.length === 0) {
    return (
      <motion.div
        variants={driverSection(0)}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-border bg-surface p-6 text-center shadow-soft"
      >
        <p className="text-sm text-muted-foreground">Nenhuma recomendação disponível no momento</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={driverSection(0)}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recomendações
        </h3>
        <span className="text-[10px] text-muted-foreground">{topRecs.length} itens</span>
      </div>
      <div className="space-y-2">
        {topRecs.map((rec, i) => (
          <EngineCard key={rec.id} rec={rec} index={i} onPress={() => onCardPress?.(rec.id)} />
        ))}
      </div>
    </motion.div>
  );
}
