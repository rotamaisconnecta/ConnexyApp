import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";

interface BrandHeaderProps {
  showLogo?: boolean;
  title?: string;
  rightAction?: ReactNode;
  className?: string;
}

export function BrandHeader({ showLogo = false, title, rightAction, className }: BrandHeaderProps) {
  return (
    <header className={cn("flex h-14 items-center justify-between px-5", className)}>
      <div className="flex items-center gap-3">
        {showLogo && <BrandLogo size="sm" variant="icon" />}
        {title && <h2 className="text-lg font-semibold text-[#18181B]">{title}</h2>}
      </div>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}
