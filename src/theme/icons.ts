/* =========================================================
   icons.ts — Official Connexy icon configuration
   Pure TypeScript. No React. No side effects.
========================================================= */

export const IconConfig = {
  size: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 40,
  },
  strokeWidth: {
    light: 1,
    regular: 1.5,
    bold: 2,
  },
} as const;

export type IconSize = keyof typeof IconConfig.size;
export type IconStrokeWidth = keyof typeof IconConfig.strokeWidth;
