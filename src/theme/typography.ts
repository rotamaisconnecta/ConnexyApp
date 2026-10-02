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

/** Hierarchical size scale for the 390×844 Demo shell. Bump by role, not by a flat px delta. */
export const TypeScale = {
  pageTitle: "text-[34px] leading-[1.18] tracking-[-0.025em]",
  screenTitle: "text-[26px] leading-[1.2] tracking-[-0.02em]",
  sectionTitle: "text-[24px] leading-[1.2] tracking-[-0.02em]",
  subsectionTitle: "text-[19px] leading-[1.2]",
  cardTitle: "text-[16px] leading-snug",
  body: "text-[16px] leading-[1.4]",
  caption: "text-[14px] leading-[1.35]",
  label: "text-[14px]",
  meta: "text-[13px] leading-[1.3]",
} as const;

export type TypographyToken = (typeof Typography)[keyof typeof Typography];
