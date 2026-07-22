/* =========================================================
   scroll-utils.ts — Scroll helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Scroll position ────────────────────────────────────── */

export function getScrollPosition(element?: HTMLElement | null): number {
  if (element) return element.scrollTop;
  if (typeof window !== "undefined") return window.scrollY;
  return 0;
}

export function isAtBottom(element: HTMLElement, threshold: number = 100): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight < threshold;
}

export function isAtTop(element: HTMLElement, threshold: number = 5): boolean {
  return element.scrollTop <= threshold;
}

/* ─── Scroll to ──────────────────────────────────────────── */

export function scrollToTop(element?: HTMLElement | null): void {
  if (element) {
    element.scrollTo({ top: 0, behavior: "smooth" });
  } else if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function scrollToBottom(element: HTMLElement): void {
  element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
}

/* ─── Snap scroll index ──────────────────────────────────── */

export function getSnapIndex(scrollLeft: number, itemWidth: number, gap: number = 0): number {
  return Math.round(scrollLeft / (itemWidth + gap));
}
