/* =========================================================
   animations.ts — Profile system animation presets
   Pure Framer Motion objects. No React. No side effects.
========================================================= */

import type { Variants, Transition } from "framer-motion";

/* ─── heroFade ───────────────────────────────────────────── */

export const heroFade: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.12, duration: 0.5, ease: "easeOut" },
  },
};

/* ─── sectionFade ────────────────────────────────────────── */

export function sectionFade(index: number): Variants {
  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.07, duration: 0.35, ease: "easeOut" },
    },
  };
}

/* ─── cardSpring ─────────────────────────────────────────── */

export const cardSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

/* ─── sheetSpring ────────────────────────────────────────── */

export const sheetSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

/* ─── chipContainer ──────────────────────────────────────── */

export const chipContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

/* ─── chipItem ───────────────────────────────────────────── */

export const chipItem: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
};

/* ─── barFill ────────────────────────────────────────────── */

export function barFill(score: number): Variants {
  return {
    initial: { width: "0%" },
    animate: {
      width: `${score}%`,
      transition: { duration: 0.8, delay: 0.3, ease: "easeOut" },
    },
  };
}

/* ─── heartToggle ────────────────────────────────────────── */

export const heartToggle: Variants = {
  idle: { scale: 1 },
  liked: {
    scale: [1, 1.3, 1],
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

/* ─── buttonTap ──────────────────────────────────────────── */

export const buttonTap = {
  whileTap: { scale: 0.98 },
};

/* ─── cardHover ──────────────────────────────────────────── */

export const cardHover = {
  whileHover: {
    y: -2,
    boxShadow: "0 20px 50px -20px color-mix(in oklab, oklch(0.55 0.24 295) 45%, transparent)",
    transition: { duration: 0.2 },
  },
};
