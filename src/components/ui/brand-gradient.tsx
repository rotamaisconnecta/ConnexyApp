import type { ReactNode } from "react";
import { Gradients } from "@/lib/branding/brand-config";

interface BrandGradientProps {
  variant?: "primary" | "premium" | "cta" | "soft";
  children: ReactNode;
  className?: string;
}

const gradientClassMap: Record<NonNullable<BrandGradientProps["variant"]>, string> = {
  primary: "bg-gradient-to-br from-[#6C3BFF] to-[#8B5CFF]",
  premium: "bg-gradient-to-br from-[#7C3AED] to-[#A855F7]",
  cta: "bg-gradient-to-br from-[#5B2EFF] to-[#A855F7]",
  soft: "bg-gradient-to-b from-[#F4F1FF] to-white",
};

export function BrandGradient({ variant = "primary", children, className }: BrandGradientProps) {
  return <div className={`${gradientClassMap[variant]} ${className ?? ""}`}>{children}</div>;
}

export { Gradients };
