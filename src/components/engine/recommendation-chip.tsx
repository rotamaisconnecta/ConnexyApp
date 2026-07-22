import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/engine/engine-types";
import { RecommendationType } from "@/lib/engine/engine-types";

interface RecommendationChipProps {
  recommendation: Recommendation;
  compact?: boolean;
}

const TYPE_ICON: Record<string, string> = {
  [RecommendationType.PERSON]: "👤",
  [RecommendationType.EVENT]: "📅",
  [RecommendationType.BUSINESS]: "🏢",
  [RecommendationType.PLACE]: "📍",
  [RecommendationType.OFFER]: "🎫",
  [RecommendationType.REEL]: "🎬",
  [RecommendationType.DRIVER]: "🚗",
  [RecommendationType.ROUTE]: "🗺️",
  [RecommendationType.NETWORKING]: "🤝",
};

export function RecommendationChip({ recommendation, compact }: RecommendationChipProps) {
  const scorePercent = Math.round(recommendation.score.total * 100);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E7E7F2] bg-white transition-colors hover:bg-[#F4F1FF]",
        compact ? "px-2 py-1" : "px-3 py-1.5",
      )}
    >
      <span className="text-sm">{TYPE_ICON[recommendation.type] ?? "✨"}</span>

      {!compact && (
        <span className="max-w-[120px] truncate text-xs font-medium text-[#18181B]">
          {recommendation.title}
        </span>
      )}

      <span
        className={cn(
          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          scorePercent >= 80
            ? "bg-green-500/15 text-green-600"
            : scorePercent >= 50
              ? "bg-amber-500/15 text-amber-600"
              : "bg-gray-100 text-gray-500",
        )}
      >
        {scorePercent}%
      </span>
    </motion.div>
  );
}
