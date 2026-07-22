/* =========================================================
   feedback-utils.ts — Feedback helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Haptic feedback (navigator.vibrate) ────────────────── */

export function hapticLight(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export function hapticMedium(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(20);
  }
}

export function hapticHeavy(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(40);
  }
}

/* ─── Debounce ───────────────────────────────────────────── */

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ─── Throttle ───────────────────────────────────────────── */

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

/* ─── Format file size ───────────────────────────────────── */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/* ─── Clamp number ───────────────────────────────────────── */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
