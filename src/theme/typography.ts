/* =========================================================
   typography.ts — Official Connexy typography tokens
   Pure TypeScript. No React. No side effects.
========================================================= */

export const Typography = {
  display: {
    fontWeight: "700" as const,
    className: "font-display font-bold",
  },
  title: {
    fontWeight: "600" as const,
    className: "font-semibold",
  },
  headline: {
    fontWeight: "600" as const,
    className: "font-semibold",
  },
  body: {
    fontWeight: "400" as const,
    className: "font-normal",
  },
  caption: {
    fontWeight: "500" as const,
    className: "font-medium",
  },
  button: {
    fontWeight: "600" as const,
    className: "font-semibold",
  },
} as const;

export type TypographyToken = (typeof Typography)[keyof typeof Typography];
