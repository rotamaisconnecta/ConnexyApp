/* =========================================================
   toast-utils.ts — Toast helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { Colors } from "@/theme";
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
  [ToastVariant.SUCCESS]: `bg-[${Colors.success}]`,
  [ToastVariant.WARNING]: `bg-[${Colors.warning}]`,
  [ToastVariant.INFO]: `bg-[${Colors.brand.primary}]`,
  [ToastVariant.DANGER]: `bg-[${Colors.danger}]`,
  [ToastVariant.LOADING]: `bg-[${Colors.text.primary}]`,
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
