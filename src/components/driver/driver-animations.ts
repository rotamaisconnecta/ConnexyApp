/* ==== driver-animations.ts -- Premium driver animation presets
   Pure Framer Motion objects. No React. No side effects. ==== */

import type { Variants, Transition } from "framer-motion";

/* ---- driverFade ---- */

export const driverFade: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/* ---- driverSection (staggered) ---- */

export function driverSection(index: number): Variants {
  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.07, duration: 0.35, ease: "easeOut" },
    },
  };
}

/* ---- driverSpring ---- */

export const driverSpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 26,
};

/* ---- driverScale ---- */

export const driverScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 22 },
  },
};

/* ---- driverSlideUp ---- */

export const driverSlideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 28 },
  },
};

/* ---- driverSlideRight ---- */

export const driverSlideRight: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
};

/* ---- modeSwitch ---- */

export const modeSwitchSpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

/* ---- pulseGlow ---- */

export const pulseGlow: Variants = {
  idle: { opacity: 0.6, scale: 1 },
  pulse: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.15, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

/* ---- cardHover ---- */

export const cardHover = {
  whileHover: {
    y: -2,
    boxShadow: "0 20px 50px -20px color-mix(in oklab, oklch(0.55 0.24 295) 45%, transparent)",
    transition: { duration: 0.2 },
  },
};

/* ---- buttonTap ---- */

export const buttonTap = {
  whileTap: { scale: 0.97 },
};

/* ---- chipContainer ---- */

export const chipContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

/* ---- chipItem ---- */

export const chipItem: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
};

/* ---- bottomSheetSpring ---- */

export const bottomSheetSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

/* ---- mapMarkerPop ---- */

export const mapMarkerPop: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
};

/* ---- statusPulse ---- */

export function statusPulse(color: string): Variants {
  return {
    idle: { boxShadow: `0 0 0 0 ${color}40` },
    pulse: {
      boxShadow: [`0 0 0 0 ${color}40`, `0 0 0 8px ${color}00`],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
    },
  };
}

/* ---- earningsCount ---- */

export const earningsCount: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.2 },
  },
};

/* ---- rideAcceptDecline ---- */

export const rideAcceptDecline: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: 60,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};
