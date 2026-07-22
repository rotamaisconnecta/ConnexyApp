/* =========================================================
   gradients.ts — Official Connexy gradient tokens
   Pure TypeScript. No React. No side effects.
========================================================= */

import { Colors } from "./colors";

export const Gradients = {
  primary: `linear-gradient(135deg, ${Colors.brand.primary}, ${Colors.brand.secondary})`,
  premium: "linear-gradient(135deg, #7C3AED, #A855F7)",
  cta: "linear-gradient(135deg, #5B2EFF, #A855F7)",
  soft: "linear-gradient(180deg, #F4F1FF, #FFFFFF)",
} as const;

export type GradientToken = (typeof Gradients)[keyof typeof Gradients];
