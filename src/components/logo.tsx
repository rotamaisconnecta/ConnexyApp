import { BrandLogo } from "@/components/ui/brand-logo";

export function Logo({
  size = 40,
  showWordmark = true,
}: {
  size?: number;
  variant?: "dark" | "light";
  showWordmark?: boolean;
}) {
  return <BrandLogo variant={showWordmark ? "full" : "icon"} size="md" />;
}
