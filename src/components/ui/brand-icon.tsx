import { Logo, Brand } from "@/lib/branding/brand-config";

interface BrandIconProps {
  size?: number;
  className?: string;
}

export function BrandIcon({ size = 40, className }: BrandIconProps) {
  return (
    <img
      src={Logo.icon}
      alt={`${Brand.primary ? "Connexy" : "Connexy"} icon`}
      className={className}
      width={size}
      height={size}
    />
  );
}
