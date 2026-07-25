import { createContext } from "react";
import type { Brand } from "@/lib/branding/brand-config";
import type { Logo } from "@/lib/branding/brand-config";
import type { Theme } from "@/lib/branding/brand-config";
import type { BRAND_TOKENS } from "@/lib/branding/brand-tokens";

export interface BrandContextValue {
  brand: typeof Brand;
  logo: typeof Logo;
  theme: typeof Theme;
  tokens: typeof BRAND_TOKENS;
}

export const BrandContext = createContext<BrandContextValue | null>(null);
