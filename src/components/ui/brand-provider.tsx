import { useMemo } from "react";
import type { ReactNode } from "react";
import { Brand, Logo, Theme } from "@/lib/branding/brand-config";
import { BRAND_TOKENS } from "@/lib/branding/brand-tokens";
import { BrandContext } from "./brand-context";

interface BrandProviderProps {
  children: ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  const value = useMemo(
    () => ({
      brand: Brand,
      logo: Logo,
      theme: Theme,
      tokens: BRAND_TOKENS,
    }),
    [],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
