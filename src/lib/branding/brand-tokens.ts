/* =========================================================
   brand-tokens.ts — Centralized brand tokens for the
   Connexy branding system. All components MUST import
   tokens from here (or from @/theme directly).
========================================================= */

import {
  Colors,
  Gradients,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Animations,
  IconConfig,
} from "../../theme";

export const BRAND_TOKENS = {
  colors: {
    primary: Colors.brand.primary,
    secondary: Colors.brand.secondary,
    light: Colors.brand.light,
    dark: Colors.brand.dark,
    background: Colors.background,
    surface: Colors.surface,
    card: Colors.card,
    border: Colors.border,
    text: Colors.text,
    muted: Colors.text.secondary,
    success: Colors.success,
    warning: Colors.warning,
    danger: Colors.danger,
  },
  gradients: Gradients,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  animations: Animations,
  icons: IconConfig,
} as const;

export type BrandTokens = typeof BRAND_TOKENS;
