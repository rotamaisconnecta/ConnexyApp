/* ==== live-status-pill.tsx -- Live status indicator pill ==== */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ==== Props ==== */

interface LiveStatusPillProps {
  label: string;
  color: "green" | "yellow" | "orange" | "red" | "purple" | "gray";
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/* ==== Color config ==== */

const COLOR_CONFIG = {
  green: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  yellow: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  orange: {
    dot: "bg-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  red: {
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  purple: {
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  gray: {
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

/* ==== Main component ==== */

export function LiveStatusPill({
  label,
  color,
  pulse = false,
  size = "md",
  className,
}: LiveStatusPillProps) {
  const config = COLOR_CONFIG[color];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", config.dot)} />
      </span>
      <span>{label}</span>
    </motion.span>
  );
}
