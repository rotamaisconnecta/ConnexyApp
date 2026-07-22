import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Recommendation, RecommendationMetadata } from "@/lib/engine/engine-types";
import { RecommendationType, ActivityLevel } from "@/lib/engine/engine-types";
import {
  Users,
  Calendar,
  Building2,
  MapPin,
  Ticket,
  Film,
  Car,
  Navigation,
  Handshake,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onSelect?: (id: string) => void;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [RecommendationType.PERSON]: Users,
  [RecommendationType.EVENT]: Calendar,
  [RecommendationType.BUSINESS]: Building2,
  [RecommendationType.PLACE]: MapPin,
  [RecommendationType.OFFER]: Ticket,
  [RecommendationType.REEL]: Film,
  [RecommendationType.DRIVER]: Car,
  [RecommendationType.ROUTE]: Navigation,
  [RecommendationType.NETWORKING]: Handshake,
};

const ACTIVITY_COLORS: Record<string, string> = {
  [ActivityLevel.CALMO]: "bg-blue-500/15 text-blue-400",
  [ActivityLevel.MODERADO]: "bg-green-500/15 text-green-400",
  [ActivityLevel.EM_ALTA]: "bg-amber-500/15 text-amber-400",
  [ActivityLevel.BOMBANDO]: "bg-orange-500/15 text-orange-400",
  [ActivityLevel.MUITO_CHEIO]: "bg-red-500/15 text-red-400",
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function getTypeBadge(metadata: RecommendationMetadata): string | null {
  switch (metadata.kind) {
    case "person":
      return `${metadata.compatibilityPercent}% compatível`;
    case "event":
      return new Date(metadata.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    case "business":
      return `★ ${metadata.rating.toFixed(1)}`;
    case "driver":
      return `ETA ${metadata.etaMinutes}min`;
    case "offer":
      return `-${metadata.discountPercent}%`;
    case "reel":
      return `${metadata.likes} curtidas`;
    case "place":
      return `★ ${metadata.rating.toFixed(1)}`;
    default:
      return null;
  }
}

export function RecommendationCard({ recommendation, onSelect }: RecommendationCardProps) {
  const Icon = TYPE_ICONS[recommendation.type] ?? Users;
  const scorePercent = Math.round(recommendation.score.total * 100);
  const typeBadge = getTypeBadge(recommendation.metadata);
  const activityColor = ACTIVITY_COLORS[recommendation.activityLevel] ?? "";

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect?.(recommendation.id)}
      className="flex w-36 shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E7E7F2] bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative h-24 w-full overflow-hidden bg-[#F4F1FF]">
        <img
          src={recommendation.imageUrl}
          alt={recommendation.title}
          className="h-full w-full object-cover"
        />

        <span
          className={cn(
            "absolute right-1.5 top-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            "bg-white/90 backdrop-blur-sm",
          )}
        >
          {scorePercent}%
        </span>

        {recommendation.trending && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <TrendingUp className="h-2.5 w-2.5" />
            Trending
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-[#A88DFF]" />
          <p className="truncate text-xs font-semibold text-[#18181B]">{recommendation.title}</p>
        </div>

        <p className="truncate text-[11px] text-[#71717A]">{recommendation.subtitle}</p>

        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          {typeBadge && (
            <span className="inline-flex items-center rounded-full bg-[#F4F1FF] px-1.5 py-0.5 text-[10px] font-medium text-[#A88DFF]">
              {typeBadge}
            </span>
          )}

          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#71717A]">
            <Navigation className="h-2.5 w-2.5" />
            {formatDistance(recommendation.distanceMeters)}
          </span>

          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              activityColor,
            )}
          >
            {recommendation.activityLevel.replace("_", " ")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
