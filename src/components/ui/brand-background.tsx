import type { ReactNode } from "react";
import { Colors, Gradients } from "@/theme";

interface BrandBackgroundProps {
  variant?: "default" | "surface" | "gradient";
  safeArea?: boolean;
  blur?: boolean;
  children: ReactNode;
  className?: string;
}

export function BrandBackground({
  variant = "default",
  safeArea = true,
  blur = false,
  children,
  className,
}: BrandBackgroundProps) {
  const bgStyle: React.CSSProperties =
    variant === "gradient"
      ? { background: Gradients.soft }
      : variant === "surface"
        ? { background: Colors.surface }
        : { background: Colors.background };

  return (
    <div
      className={`min-h-screen ${safeArea ? "pt-safe" : ""} ${blur ? "backdrop-blur-sm" : ""} ${className ?? ""}`}
      style={{ ...bgStyle, color: Colors.text.primary }}
    >
      {children}
    </div>
  );
}
