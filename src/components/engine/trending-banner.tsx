import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ActivityLevelValue } from "@/lib/engine/engine-types";
import { ActivityLevel } from "@/lib/engine/engine-types";

interface TrendingBannerProps {
  title: string;
  subtitle: string;
  activityLevel: ActivityLevelValue;
  emoji: string;
  actionLabel?: string;
  onAction?: () => void;
}

const LEVEL_BG: Record<string, string> = {
  [ActivityLevel.CALMO]: "bg-blue-500/10 border-blue-500/20",
  [ActivityLevel.MODERADO]: "bg-green-500/10 border-green-500/20",
  [ActivityLevel.EM_ALTA]: "bg-amber-500/10 border-amber-500/20",
  [ActivityLevel.BOMBANDO]: "bg-orange-500/10 border-orange-500/20",
  [ActivityLevel.MUITO_CHEIO]: "bg-red-500/10 border-red-500/20",
};

const LEVEL_TEXT: Record<string, string> = {
  [ActivityLevel.CALMO]: "text-blue-500",
  [ActivityLevel.MODERADO]: "text-green-500",
  [ActivityLevel.EM_ALTA]: "text-amber-500",
  [ActivityLevel.BOMBANDO]: "text-orange-500",
  [ActivityLevel.MUITO_CHEIO]: "text-red-500",
};

const isPulsing = (level: ActivityLevelValue) =>
  level === ActivityLevel.BOMBANDO || level === ActivityLevel.MUITO_CHEIO;

export function TrendingBanner({
  title,
  subtitle,
  activityLevel,
  emoji,
  actionLabel,
  onAction,
}: TrendingBannerProps) {
  return (
    <motion.div
      animate={isPulsing(activityLevel) ? { scale: [1, 1.01, 1] } : undefined}
      transition={isPulsing(activityLevel) ? { duration: 2, repeat: Infinity } : undefined}
      className={cn("flex items-center gap-3 rounded-2xl border p-3", LEVEL_BG[activityLevel])}
    >
      <span className="text-2xl">{emoji}</span>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", LEVEL_TEXT[activityLevel])}>{title}</p>
        <p className="truncate text-xs text-[#71717A]">{subtitle}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white",
            LEVEL_TEXT[activityLevel].replace("text-", "bg-"),
          )}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
