export const CAROUSEL_SWIPE_HINT_KEY = "connexy-carousel-swipe-hint-seen";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
