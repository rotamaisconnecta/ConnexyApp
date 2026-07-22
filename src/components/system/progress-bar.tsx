import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-3",
  lg: "h-5",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  color,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: Colors.text.secondary }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn("w-full overflow-hidden", sizeMap[size])}
        style={{ borderRadius: Radius.floating, backgroundColor: Colors.surface }}
      >
        <motion.div
          className={cn("h-full", sizeMap[size])}
          style={{
            borderRadius: Radius.floating,
            background: color
              ? color
              : `linear-gradient(90deg, ${Colors.brand.primary}, ${Colors.brand.secondary})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
