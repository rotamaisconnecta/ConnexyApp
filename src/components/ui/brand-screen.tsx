import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors } from "@/theme";

interface BrandScreenProps {
  padded?: boolean;
  safeArea?: boolean;
  scroll?: boolean;
  children: ReactNode;
  className?: string;
}

export function BrandScreen({
  padded = true,
  safeArea = true,
  scroll = false,
  children,
  className,
}: BrandScreenProps) {
  return (
    <div
      className={cn(
        "min-h-screen",
        safeArea && "pt-safe",
        padded && "px-5",
        scroll && "overflow-y-auto",
        className,
      )}
      style={{ background: Colors.background, color: Colors.text.primary }}
    >
      {children}
    </div>
  );
}
