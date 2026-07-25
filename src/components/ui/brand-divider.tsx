import { cn } from "@/lib/utils";

interface BrandDividerProps {
  className?: string;
}

export function BrandDivider({ className }: BrandDividerProps) {
  return <hr className={cn("border-t border-border", className)} />;
}
