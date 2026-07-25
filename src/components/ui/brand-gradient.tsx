import type { ReactNode } from "react";
import { Gradients } from "@/theme";

interface BrandGradientProps {
  variant?: "primary" | "premium" | "cta" | "soft";
  className?: string;
  children: ReactNode;
}

export function BrandGradient({ variant = "primary", className, children }: BrandGradientProps) {
  return (
    <div className={className} style={{ background: Gradients[variant] }}>
      {children}
    </div>
  );
}
