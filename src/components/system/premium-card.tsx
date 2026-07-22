import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: ReactNode;
  glow?: boolean;
  className?: string;
}

export function PremiumCard({ children, glow = false, className }: PremiumCardProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-[#6C3BFF] to-[#A855F7] p-[1px] rounded-[24px]",
        glow && "shadow-[0_8px_32px_rgba(108,59,255,0.15)]",
        className,
      )}
    >
      <div className="bg-white rounded-[22px] p-4">{children}</div>
    </div>
  );
}
