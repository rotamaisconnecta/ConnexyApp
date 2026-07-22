/* =========================================================
   animations.ts — Official Connexy animation tokens
   Pure TypeScript. No React. No side effects.
========================================================= */

export const Animations = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  hero: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
  bottomSheet: {
    initial: { y: "100%" },
    animate: {
      y: 0,
      transition: { type: "spring" as const, damping: 30, stiffness: 300 },
    },
    exit: {
      y: "100%",
      transition: { type: "spring" as const, damping: 35, stiffness: 300 },
    },
  },
  cardHover: {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  floatingButton: {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 },
    },
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
  },
  buttonPress: {
    tap: { scale: 0.97 },
    transition: { duration: 0.1 },
  },
} as const;

export type AnimationToken = (typeof Animations)[keyof typeof Animations];
