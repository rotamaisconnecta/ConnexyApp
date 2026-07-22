import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrandBadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "premium";
  children: ReactNode;
  className?: string;
}

const variantClassMap: Record<NonNullable<BrandBadgeProps["variant"]>, string> = {
  default: "bg-[#F4F1FF] text-[#6C3BFF]",
  success: "bg-[#22C55E]/10 text-[#22C55E]",
  warning: "bg-[#F59E0B]/10 text-[#F59E0B]",
  danger: "bg-[#EF4444]/10 text-[#EF4444]",
  premium: "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white",
};

export function BrandBadge({ variant = "default", children, className }: BrandBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        variantClassMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
