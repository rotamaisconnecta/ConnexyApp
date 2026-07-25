import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Colors, Gradients, Radius, Shadows } from "@/theme";

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "premium";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const sizeClassMap: Record<NonNullable<BrandButtonProps["size"]>, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

function getVariantStyle(variant: NonNullable<BrandButtonProps["variant"]>): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: Gradients.primary,
        color: Colors.background,
        boxShadow: Shadows.floatingButton,
      };
    case "secondary":
      return { background: Colors.surface, color: Colors.brand.primary };
    case "ghost":
      return { background: "transparent", color: Colors.text.primary };
    case "outline":
      return {
        border: `1px solid ${Colors.border}`,
        background: Colors.card,
        color: Colors.text.primary,
      };
    case "danger":
      return { background: Colors.danger, color: Colors.background };
    case "premium":
      return {
        background: Gradients.premium,
        color: Colors.background,
        boxShadow: Shadows.premiumCard,
      };
  }
}

export function BrandButton({
  variant = "primary",
  size = "md",
  children,
  className,
  disabled,
  ...rest
}: BrandButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97]",
        sizeClassMap[size],
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      style={{ borderRadius: Radius.md, ...getVariantStyle(variant) }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
