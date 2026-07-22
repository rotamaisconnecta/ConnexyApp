/* =========================================================
   shadows.ts — Official Connexy shadow tokens
   Pure TypeScript. No React. No side effects.
========================================================= */

export const Shadows = {
  soft: "0 2px 8px rgba(0, 0, 0, 0.04)",
  medium: "0 4px 16px rgba(0, 0, 0, 0.08)",
  large: "0 8px 32px rgba(0, 0, 0, 0.12)",
  floatingButton: "0 8px 24px rgba(108, 59, 255, 0.35)",
  premiumCard: "0 8px 32px rgba(108, 59, 255, 0.15)",
} as const;

export type ShadowToken = (typeof Shadows)[keyof typeof Shadows];
