import { Logo, Brand } from "@/lib/branding/brand-config";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
  animated?: boolean;
}

const sizeMap: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "w-20 h-6",
  md: "w-28 h-8",
  lg: "w-36 h-10",
  xl: "w-48 h-14",
};

export function BrandLogo({ size = "md", variant = "full", className, animated }: BrandLogoProps) {
  const src = variant === "icon" ? Logo.icon : Logo.default;
  const alt = `${Brand.primary ? "Connexy" : "Connexy"} logo`;

  return (
    <img
      src={src}
      alt={alt}
      className={animated ? `animate-pulse ${className ?? ""}` : className}
      style={{ height: "auto" }}
      width={variant === "icon" ? 40 : undefined}
    />
  );
}
