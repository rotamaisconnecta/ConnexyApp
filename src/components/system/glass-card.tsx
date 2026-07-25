import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Shadows } from "@/theme";

interface GlassCardProps {
  children: ReactNode;
  blur?: boolean;
  className?: string;
}

export function GlassCard({ children, blur = true, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/70 border border-white/20 p-4",
        blur && "backdrop-blur-xl",
        className,
      )}
      style={{ borderRadius: 24, boxShadow: Shadows.medium }}
    >
      {children}
    </div>
  );
}
