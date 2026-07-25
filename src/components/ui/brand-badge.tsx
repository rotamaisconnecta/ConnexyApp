import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors, Gradients } from "@/theme";

interface BrandBadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "premium";
  children: ReactNode;
  className?: string;
}

function getBadgeStyle(variant: NonNullable<BrandBadgeProps["variant"]>): React.CSSProperties {
  switch (variant) {
    case "default":
      return { background: Colors.surface, color: Colors.brand.primary };
    case "success":
      return { background: `${Colors.success}1A`, color: Colors.success };
    case "warning":
      return { background: `${Colors.warning}1A`, color: Colors.warning };
    case "danger":
      return { background: `${Colors.danger}1A`, color: Colors.danger };
    case "premium":
      return { background: Gradients.premium, color: Colors.background };
  }
}

export function BrandBadge({ variant = "default", children, className }: BrandBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        className,
      )}
      style={getBadgeStyle(variant)}
    >
      {children}
    </span>
  );
}
