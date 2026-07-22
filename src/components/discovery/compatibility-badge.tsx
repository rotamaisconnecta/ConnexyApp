import { cn } from "@/lib/utils";
import type { CompatibilityTier } from "@/lib/profile/compatibility";

interface CompatibilityBadgeProps {
  score: number;
  tier: CompatibilityTier;
  label: string;
  size?: "sm" | "md";
}

const TIER_CLASSES: Record<string, string> = {
  excelente: "bg-gradient-brand text-white",
  alta: "bg-primary/15 text-primary",
  compativel: "bg-accent text-primary",
};

export function CompatibilityBadge({ score, tier, label, size = "sm" }: CompatibilityBadgeProps) {
  if (!tier || !label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        TIER_CLASSES[tier] ?? "bg-secondary text-muted-foreground",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      )}
    >
      {score}% · {label}
    </span>
  );
}
