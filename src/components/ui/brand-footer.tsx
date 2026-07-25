import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrandFooterProps {
  children: ReactNode;
  className?: string;
}

export function BrandFooter({ children, className }: BrandFooterProps) {
  return (
    <footer
      className={cn(
        "flex items-center justify-center border-t border-border bg-white px-5 py-4",
        className,
      )}
    >
      {children}
    </footer>
  );
}
