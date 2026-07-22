import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  padded?: boolean;
  safeArea?: boolean;
  className?: string;
}

export function PageContainer({
  children,
  padded = true,
  safeArea = true,
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-white",
        padded && "px-4",
        safeArea && "pt-safe pb-safe",
        className,
      )}
    >
      {children}
    </div>
  );
}
