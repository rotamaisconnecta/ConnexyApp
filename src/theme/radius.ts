/* =========================================================
   radius.ts — Official Connexy border radius tokens
   Pure TypeScript. No React. No side effects.
========================================================= */

export const Radius = {
  sm: "12px",
  md: "18px",
  lg: "24px",
  xl: "32px",
  floating: "9999px",
} as const;

export type RadiusToken = (typeof Radius)[keyof typeof Radius];
