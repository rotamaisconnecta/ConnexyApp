import { Logo } from "@/lib/branding/brand-config";

interface BrandIconProps {
  size?: number;
  className?: string;
}

export function BrandIcon({ size = 40, className }: BrandIconProps) {
  return <img src={Logo.icon} alt="Connexy" className={className} width={size} height={size} />;
}
