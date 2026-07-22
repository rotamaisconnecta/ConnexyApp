import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className }: SectionDividerProps) {
  return <hr className={cn("border-t border-[#E7E7F2]", className)} />;
}
