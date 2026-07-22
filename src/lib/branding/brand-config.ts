/* =========================================================
   brand-config.ts — Single source of truth for the
   Connexy branding system. Re-exports every theme token
   and provides convenient access patterns.
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
import type {
  ColorToken,
  GradientToken,
  TypographyToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  AnimationToken,
  IconSize,
  IconStrokeWidth,
} from "../../theme";

/* -----------------------------------------------------------
   Brand — brand color shortcuts
----------------------------------------------------------- */
export const Brand = {
  primary: Colors.brand.primary,
  secondary: Colors.brand.secondary,
  light: Colors.brand.light,
  dark: Colors.brand.dark,
} as const;

/* -----------------------------------------------------------
   Logo — import paths (use with <img> or next/image)
----------------------------------------------------------- */
export const Logo = {
  default: new URL("../../assets/connexy-logo.png", import.meta.url).href,
  icon: new URL("../../assets/connexy-icon.png", import.meta.url).href,
} as const;

export { Colors, Typography, Radius, Gradients, Shadows, IconConfig as Icons, Spacing, Animations };

/* -----------------------------------------------------------
   Theme — full theme object (for context providers, etc.)
----------------------------------------------------------- */
export const Theme = {
  Colors,
  Brand,
  Logo,
  Typography,
  Radius,
  Gradients,
  Icons: IconConfig,
  Spacing,
  Shadows,
  Animations,
} as const;

/* -----------------------------------------------------------
   Type re-exports
----------------------------------------------------------- */
export type {
  ColorToken,
  GradientToken,
  TypographyToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  AnimationToken,
  IconSize,
  IconStrokeWidth,
};
