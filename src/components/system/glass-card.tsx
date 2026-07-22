import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  blur?: boolean;
  className?: string;
}

export function GlassCard({ children, blur = true, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/70 border border-white/20 rounded-[24px] p-4",
        "shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
        blur && "backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
