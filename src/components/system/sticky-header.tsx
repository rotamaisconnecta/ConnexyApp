import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors } from "@/theme";

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
        background: "color-mix(in oklab, var(--background) 80%, transparent)",
        borderBottom: `1px solid ${Colors.border}`,
      }}
    >
      {children}
    </div>
  );
}
