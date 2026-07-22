import { Logo } from "@/lib/branding/brand-config";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
  animated?: boolean;
}

const sizeMap: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "w-20 h-6",
  md: "w-28 h-8",
  lg: "w-40 h-11",
  xl: "w-48 h-14",
};

export function BrandLogo({ size = "md", variant = "full", className, animated }: BrandLogoProps) {
  const src = variant === "icon" ? Logo.icon : Logo.default;

  return (
    <img
      src={src}
      alt="Connexy"
      className={cn(sizeMap[size], animated && "animate-pulse", className)}
      style={{ height: "auto" }}
    />
  );
}
