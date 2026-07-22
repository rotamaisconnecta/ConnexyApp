import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "premium";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClassMap: Record<NonNullable<BrandButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF] text-white shadow-[0_4px_16px_rgba(108,59,255,0.35)]",
  secondary: "bg-[#F4F1FF] text-[#6C3BFF]",
  ghost: "bg-transparent text-[#18181B]",
  outline: "border border-[#E7E7F2] bg-white text-[#18181B]",
  danger: "bg-[#EF4444] text-white",
  premium:
    "bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)]",
};

const sizeClassMap: Record<NonNullable<BrandButtonProps["size"]>, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

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
        "inline-flex items-center justify-center gap-2 rounded-[18px] font-semibold transition-all active:scale-[0.97]",
        variantClassMap[variant],
        sizeClassMap[size],
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
