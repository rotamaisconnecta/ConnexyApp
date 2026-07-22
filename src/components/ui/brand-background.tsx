import type { ReactNode } from "react";
import { Colors } from "@/lib/branding/brand-config";

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
  const bgClass =
    variant === "gradient"
      ? "bg-gradient-to-b from-[#F4F1FF] to-white"
      : variant === "surface"
        ? "bg-[#F8F8FC]"
        : "bg-white";

  return (
    <div
      className={`min-h-screen ${bgClass} ${safeArea ? "pt-safe" : ""} ${blur ? "backdrop-blur-sm" : ""} ${className ?? ""}`}
      style={{ color: Colors.text.primary }}
    >
      {children}
    </div>
  );
}
