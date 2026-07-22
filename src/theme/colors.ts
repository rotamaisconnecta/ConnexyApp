/* =========================================================
   colors.ts — Official Connexy color tokens
   Pure TypeScript. No React. No side effects.
========================================================= */

export const Colors = {
  brand: {
    primary: "#6C3BFF",
    secondary: "#8B5CFF",
    light: "#A88DFF",
    dark: "#4B21D6",
  },
  background: "#FFFFFF",
  surface: "#F8F8FC",
  card: "#FFFFFF",
  border: "#E7E7F2",
  text: {
    primary: "#18181B",
    secondary: "#71717A",
  },
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export type ColorToken = (typeof Colors)[keyof typeof Colors];
