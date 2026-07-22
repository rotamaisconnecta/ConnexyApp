/* =========================================================
   animation-utils.ts — Animation helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Framer Motion presets ──────────────────────────────── */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const springSheet = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    transition: { type: "spring" as const, damping: 35, stiffness: 300 },
  },
};

export const toastIn = {
  initial: { opacity: 0, y: -40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -40, scale: 0.95 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export const snackbarIn = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 60 },
  transition: { type: "spring" as const, damping: 25, stiffness: 300 },
};

export const modalIn = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const drawerIn = {
  initial: { x: "100%" },
  animate: {
    x: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: {
    x: "100%",
    transition: { type: "spring" as const, damping: 35, stiffness: 300 },
  },
};

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const pressScale = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const ripple = {
  initial: { scale: 0, opacity: 0.5 },
  animate: { scale: 4, opacity: 0, transition: { duration: 0.5 } },
};

/* ─── Stagger children ───────────────────────────────────── */

export function getStaggerContainer(staggerChildren: number = 0.05) {
  return {
    animate: {
      transition: { staggerChildren },
    },
  };
}
