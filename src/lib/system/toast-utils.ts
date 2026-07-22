/* =========================================================
   toast-utils.ts — Toast helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { ToastVariant } from "./system-types";
import type { ToastVariantValue } from "./system-types";

/* ─── Default durations (ms) ─────────────────────────────── */

const TOAST_DURATION: Record<ToastVariantValue, number> = {
  [ToastVariant.SUCCESS]: 3000,
  [ToastVariant.WARNING]: 4000,
  [ToastVariant.INFO]: 3500,
  [ToastVariant.DANGER]: 5000,
  [ToastVariant.LOADING]: Infinity,
};

export function getDefaultDuration(variant: ToastVariantValue): number {
  return TOAST_DURATION[variant];
}

/* ─── Background classes ─────────────────────────────────── */

const TOAST_BG: Record<ToastVariantValue, string> = {
  [ToastVariant.SUCCESS]: "bg-[#22C55E]",
  [ToastVariant.WARNING]: "bg-[#F59E0B]",
  [ToastVariant.INFO]: "bg-[#6C3BFF]",
  [ToastVariant.DANGER]: "bg-[#EF4444]",
  [ToastVariant.LOADING]: "bg-[#18181B]",
};

export function getToastBgClass(variant: ToastVariantValue): string {
  return TOAST_BG[variant];
}

/* ─── Generate unique ID ─────────────────────────────────── */

let counter = 0;

export function generateToastId(): string {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}
