import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Radius } from "@/lib/branding/brand-config";
import { Star } from "lucide-react";
import { hapticLight } from "@/lib/system/feedback-utils";

interface RatingStarsProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const sizeClassMap: Record<NonNullable<RatingStarsProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function RatingStars({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const handleClick = (star: number) => {
    if (!interactive) return;
    hapticLight();
    onChange?.(star);
  };

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= value;

        return (
          <motion.button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            whileTap={interactive ? { scale: 0.85 } : undefined}
            disabled={!interactive}
            className={cn("transition-colors", sizeClassMap[size], interactive && "cursor-pointer")}
            style={{
              color: filled ? "#F59E0B" : "#E7E7F2",
              borderRadius: Radius.floating,
            }}
          >
            <Star
              className={cn(sizeClassMap[size], filled && "fill-current")}
              style={{ color: filled ? "#F59E0B" : "#E7E7F2" }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
