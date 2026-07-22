/* ==== trending-indicator.tsx -- Trending direction indicator ==== */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendingDirectionValue } from "@/lib/integration/integration-types";
import { TrendingDirection } from "@/lib/integration/integration-types";
import { getTrendingColor } from "@/lib/integration/integration-utils";

/* ==== Props ==== */

interface TrendingIndicatorProps {
  direction: TrendingDirectionValue;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/* ==== Icon map ==== */

const ICON_MAP: Record<TrendingDirectionValue, typeof TrendingUp> = {
  UP: TrendingUp,
  DOWN: TrendingDown,
  STABLE: Minus,
};

/* ==== Main component ==== */

export function TrendingIndicator({
  direction,
  label,
  showLabel = false,
  size = "md",
  className,
}: TrendingIndicatorProps) {
  const Icon = ICON_MAP[direction];
  const color = getTrendingColor(direction);

  const defaultLabel =
    direction === TrendingDirection.UP
      ? "Subindo"
      : direction === TrendingDirection.DOWN
        ? "Caindo"
        : "Estável";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("inline-flex items-center gap-1", className)}
    >
      <Icon className={cn(color, size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {showLabel && (
        <span className={cn("font-medium", color, size === "sm" ? "text-[10px]" : "text-xs")}>
          {label ?? defaultLabel}
        </span>
      )}
    </motion.div>
  );
}

/* ==== Trending badge (compact) ==== */

interface TrendingBadgeProps {
  direction: TrendingDirectionValue;
  className?: string;
}

export function TrendingBadge({ direction, className }: TrendingBadgeProps) {
  const bgColors: Record<TrendingDirectionValue, string> = {
    UP: "bg-emerald-50 text-emerald-600 border-emerald-200",
    DOWN: "bg-red-50 text-red-600 border-red-200",
    STABLE: "bg-gray-50 text-gray-500 border-gray-200",
  };

  const labels: Record<TrendingDirectionValue, string> = {
    UP: "↗ Subindo",
    DOWN: "↘ Caindo",
    STABLE: "→ Estável",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        bgColors[direction],
        className,
      )}
    >
      {labels[direction]}
    </motion.span>
  );
}
