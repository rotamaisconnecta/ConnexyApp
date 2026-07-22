import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-base font-semibold text-[#18181B]">{title}</span>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
