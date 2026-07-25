import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors, Radius, Shadows } from "@/theme";

interface BrandCardProps {
  children: ReactNode;
  padding?: boolean;
  shadow?: "soft" | "medium" | "large" | "premium";
  className?: string;
  onClick?: () => void;
}

const shadowMap: Record<NonNullable<BrandCardProps["shadow"]>, string> = {
  soft: Shadows.soft,
  medium: Shadows.medium,
  large: Shadows.large,
  premium: Shadows.premiumCard,
};

export function BrandCard({
  children,
  padding = true,
  shadow = "soft",
  className,
  onClick,
}: BrandCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white",
        padding && "p-4",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className,
      )}
      style={{
        borderRadius: Radius.md,
        border: `1px solid ${Colors.border}`,
        boxShadow: shadowMap[shadow],
      }}
    >
      {children}
    </div>
  );
}
