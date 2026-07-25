import { Logo } from "@/lib/branding/brand-config";
import { cn } from "@/lib/utils";

interface AppIconProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  animated?: boolean;
  priority?: boolean;
}

const sizeMap: Record<NonNullable<AppIconProps["size"]>, string> = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
  "2xl": "w-28 h-28",
};

export function AppIcon({ size = "md", className, animated, priority }: AppIconProps) {
  return (
    <img
      src={Logo.icon}
      alt="Connexy"
      className={cn(sizeMap[size], animated && "animate-pulse", className)}
      style={{ height: "auto" }}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
