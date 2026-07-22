import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
}

export function HorizontalScroller({ children, className, gap = 12 }: HorizontalScrollerProps) {
  return (
    <div
      className={cn("flex overflow-x-auto snap-x snap-start scrollbar-none", className)}
      style={{
        gap: `${gap}px`,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}
