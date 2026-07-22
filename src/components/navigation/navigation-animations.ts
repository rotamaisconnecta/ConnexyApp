/* =========================================================
   navigation-animations.ts — Framer Motion animation variants
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { Variants } from "framer-motion";

/* ─── bottomNavContainer ────────────────────────────────── */

export const bottomNavContainer: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

/* ─── bottomNavItem ─────────────────────────────────────── */

export const bottomNavItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

/* ─── centerButton ──────────────────────────────────────── */

export const centerButton: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut", delay: 0.15 },
  },
  tap: { scale: 0.95 },
  hover: { scale: 1.05 },
};

/* ─── sheetOverlay ──────────────────────────────────────── */

export const sheetOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/* ─── sheetContainer ────────────────────────────────────── */

export const sheetContainer: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    transition: { type: "spring", damping: 35, stiffness: 300 },
  },
};

/* ─── sheetItem ─────────────────────────────────────────── */

export const sheetItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.25,
      ease: "easeOut",
    },
  }),
};
