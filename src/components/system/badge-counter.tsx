import { cn } from "@/lib/utils";
import { Radius } from "@/lib/branding/brand-config";

interface BadgeCounterProps {
  count: number;
  max?: number;
  className?: string;
}

export function BadgeCounter({ count, max = 99, className }: BadgeCounterProps) {
  const display = count > max ? `${max}+` : count;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
        className,
      )}
      style={{
        backgroundColor: "#EF4444",
        color: "#FFFFFF",
        borderRadius: Radius.floating,
        minWidth: 16,
        height: 16,
      }}
    >
      {display}
    </span>
  );
}
