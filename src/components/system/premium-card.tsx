import type { ReactNode } from "react";
import { Gradients, Radius, Shadows } from "@/theme";

interface PremiumCardProps {
  children: ReactNode;
  glow?: boolean;
  className?: string;
}

export function PremiumCard({ children, glow = false, className }: PremiumCardProps) {
  return (
    <div
      className={className}
      style={{
        background: Gradients.premium,
        borderRadius: Radius.lg,
        boxShadow: glow ? Shadows.premiumCard : undefined,
      }}
    >
      <div className="bg-white p-4" style={{ borderRadius: Radius.lg }}>
        {children}
      </div>
    </div>
  );
}
