/* =========================================================
   dialog-utils.ts — Dialog/Modal helper functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { ModalSize } from "./system-types";
import type { ModalSizeValue } from "./system-types";

/* ─── Size classes ───────────────────────────────────────── */

const MODAL_SIZE_MAP: Record<ModalSizeValue, string> = {
  [ModalSize.SM]: "max-w-sm",
  [ModalSize.MD]: "max-w-md",
  [ModalSize.LG]: "max-w-lg",
  [ModalSize.FULLSCREEN]: "max-w-full h-full",
};

export function getModalSizeClass(size: ModalSizeValue): string {
  return MODAL_SIZE_MAP[size];
}

/* ─── Backdrop classes ───────────────────────────────────── */

export function getBackdropClass(): string {
  return "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm";
}

/* ─── Dialog content classes ─────────────────────────────── */

export function getDialogContentClass(size: ModalSizeValue): string {
  const sizeClass = getModalSizeClass(size);
  return `relative mx-auto ${sizeClass} rounded-[24px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]`;
}
