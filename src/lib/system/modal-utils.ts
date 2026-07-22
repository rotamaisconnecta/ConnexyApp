/* =========================================================
   modal-utils.ts — Modal helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Body scroll lock ───────────────────────────────────── */

export function lockBodyScroll(): void {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "hidden";
  }
}

export function unlockBodyScroll(): void {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
}

/* ─── Focus trap key handler ─────────────────────────────── */

export function handleFocusTrap(e: React.KeyboardEvent): void {
  if (e.key === "Escape") {
    e.preventDefault();
    (e.currentTarget as HTMLElement).click();
  }
}

/* ─── Animation delay by index ───────────────────────────── */

export function getStaggerDelay(index: number, baseMs: number = 50): number {
  return index * baseMs;
}
