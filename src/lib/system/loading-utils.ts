/* =========================================================
   loading-utils.ts — Loading state helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Skeleton line widths (percentage strings) ──────────── */

export const SKELETON_WIDTHS = {
  FULL: "w-full",
  THREE_QUARTERS: "w-3/4",
  HALF: "w-1/2",
  ONE_THIRD: "w-1/3",
  QUARTER: "w-1/4",
} as const;

/* ─── Skeleton row generation ────────────────────────────── */

export interface SkeletonRow {
  width: string;
  height: string;
}

export function generateTextSkeleton(rows: number = 3): SkeletonRow[] {
  const widths = ["w-full", "w-3/4", "w-5/6", "w-2/3", "w-4/5"];
  return Array.from({ length: rows }, (_, i) => ({
    width: widths[i % widths.length],
    height: "h-3",
  }));
}

export function generateListSkeleton(count: number = 5): SkeletonRow[] {
  return Array.from({ length: count }, () => ({
    width: "w-full",
    height: "h-16",
  }));
}

/* ─── Spinner size map ───────────────────────────────────── */

export const SPINNER_SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
} as const;

export type SpinnerSize = keyof typeof SPINNER_SIZE_MAP;

export function getSpinnerClass(size: SpinnerSize = "md"): string {
  return SPINNER_SIZE_MAP[size];
}
