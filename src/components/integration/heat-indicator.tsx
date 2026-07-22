/* ==== heat-indicator.tsx -- Activity heat indicator ==== */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeatLevelValue } from "@/lib/integration/integration-types";
import { HeatLevel, HeatMeta } from "@/lib/integration/integration-types";

/* ==== Props ==== */

interface HeatIndicatorProps {
  level: HeatLevelValue;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/* ==== Size config ==== */

const SIZE_CONFIG = {
  sm: { dot: "h-2 w-2", text: "text-[10px]", gap: "gap-1" },
  md: { dot: "h-2.5 w-2.5", text: "text-xs", gap: "gap-1.5" },
  lg: { dot: "h-3 w-3", text: "text-sm", gap: "gap-2" },
};

/* ==== Main component ==== */

export function HeatIndicator({
  level,
  showLabel = true,
  size = "md",
  className,
}: HeatIndicatorProps) {
  const meta = HeatMeta[level];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("inline-flex items-center", sizeConfig.gap, className)}
    >
      <span className="relative flex items-center justify-center">
        {meta.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              meta.color,
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full", meta.color, sizeConfig.dot)} />
      </span>
      {showLabel && (
        <span className={cn("font-medium text-foreground", sizeConfig.text)}>{meta.label}</span>
      )}
    </motion.div>
  );
}

/* ==== Heat bar (visual scale) ==== */

interface HeatBarProps {
  level: HeatLevelValue;
  className?: string;
}

const HEAT_LEVELS: HeatLevelValue[] = [
  HeatLevel.COLD,
  HeatLevel.WARM,
  HeatLevel.HOT,
  HeatLevel.BURNING,
];

export function HeatBar({ level, className }: HeatBarProps) {
  const activeIndex = HEAT_LEVELS.indexOf(level);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex items-center gap-0.5", className)}
    >
      {HEAT_LEVELS.map((l, i) => {
        const meta = HeatMeta[l];
        const isActive = i <= activeIndex;

        return (
          <motion.div
            key={l}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "h-3 w-1.5 rounded-full transition-colors",
              isActive ? meta.color : "bg-gray-200",
            )}
          />
        );
      })}
    </motion.div>
  );
}

/* ==== Heat circle (compact) ==== */

interface HeatCircleProps {
  level: HeatLevelValue;
  size?: number;
  className?: string;
}

export function HeatCircle({ level, size = 24, className }: HeatCircleProps) {
  const meta = HeatMeta[level];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {meta.pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
            meta.color,
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-full w-full items-center justify-center rounded-full",
          meta.color,
          "text-white text-[8px] font-bold",
        )}
      >
        {level === HeatLevel.COLD && "❄"}
        {level === HeatLevel.WARM && "☀"}
        {level === HeatLevel.HOT && "🔥"}
        {level === HeatLevel.BURNING && "💥"}
      </span>
    </motion.div>
  );
}
