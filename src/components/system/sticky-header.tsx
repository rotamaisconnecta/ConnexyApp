import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors } from "@/lib/branding/brand-config";

interface StickyHeaderProps {
  children: ReactNode;
  top?: number;
  className?: string;
}

export function StickyHeader({ children, top = 0, className }: StickyHeaderProps) {
  return (
    <div
      className={cn("sticky z-20 backdrop-blur-xl", className)}
      style={{
        top,
        background: "rgba(255,255,255,0.8)",
        borderBottom: `1px solid ${Colors.border}`,
      }}
    >
      {children}
    </div>
  );
}
