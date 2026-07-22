import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Radius, Shadows } from "@/lib/branding/brand-config";

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
        "rounded-[18px] border border-[#E7E7F2] bg-white",
        padding && "p-4",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className,
      )}
      style={{ boxShadow: shadowMap[shadow] }}
    >
      {children}
    </div>
  );
}

export { Radius, Shadows };
