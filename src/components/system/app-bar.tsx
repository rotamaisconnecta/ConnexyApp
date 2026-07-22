import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors, Shadows } from "@/lib/branding/brand-config";

interface AppBarProps {
  title?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  transparent?: boolean;
  className?: string;
}

export function AppBar({
  title,
  leftAction,
  rightAction,
  transparent = false,
  className,
}: AppBarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4",
        "backdrop-blur-xl",
        className,
      )}
      style={{
        height: 56,
        background: transparent ? "transparent" : "rgba(255,255,255,0.8)",
        borderBottom: transparent ? "none" : `1px solid ${Colors.border}`,
        boxShadow: transparent ? "none" : Shadows.soft,
      }}
    >
      <div className="flex items-center">{leftAction}</div>
      <div className="flex-1 text-center">
        {title && (
          <span className="text-sm font-semibold" style={{ color: Colors.text.primary }}>
            {title}
          </span>
        )}
      </div>
      <div className="flex items-center">{rightAction}</div>
    </header>
  );
}
