import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrandSectionProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function BrandSection({ title, action, children, className }: BrandSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-1">
          {title && <h3 className="text-base font-semibold text-[#18181B]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
