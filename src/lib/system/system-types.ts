/* =========================================================
   system-types.ts — Central type definitions for the
   Connexy Design System. Pure TypeScript. No React.
========================================================= */

/* ─── Toast ──────────────────────────────────────────────── */

export const ToastVariant = {
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  INFO: "INFO",
  DANGER: "DANGER",
  LOADING: "LOADING",
} as const;

export type ToastVariantValue = (typeof ToastVariant)[keyof typeof ToastVariant];

export interface ToastData {
  id: string;
  variant: ToastVariantValue;
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

/* ─── Snackbar ───────────────────────────────────────────── */

export const SnackbarVariant = {
  DEFAULT: "DEFAULT",
  SUCCESS: "SUCCESS",
  DANGER: "DANGER",
} as const;

export type SnackbarVariantValue = (typeof SnackbarVariant)[keyof typeof SnackbarVariant];

export interface SnackbarData {
  id: string;
  variant: SnackbarVariantValue;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

/* ─── Dialog / Modal ─────────────────────────────────────── */

export const ModalSize = {
  SM: "SM",
  MD: "MD",
  LG: "LG",
  FULLSCREEN: "FULLSCREEN",
} as const;

export type ModalSizeValue = (typeof ModalSize)[keyof typeof ModalSize];

/* ─── Bottom Sheet ───────────────────────────────────────── */

export const BottomSheetSnap = {
  HALF: "HALF",
  FULL: "FULL",
} as const;

export type BottomSheetSnapValue = (typeof BottomSheetSnap)[keyof typeof BottomSheetSnap];

/* ─── Skeleton ───────────────────────────────────────────── */

export const SkeletonVariant = {
  TEXT: "TEXT",
  CARD: "CARD",
  AVATAR: "AVATAR",
  IMAGE: "IMAGE",
  LIST: "LIST",
  FEED: "FEED",
  CHAT: "CHAT",
  MARKETPLACE: "MARKETPLACE",
} as const;

export type SkeletonVariantValue = (typeof SkeletonVariant)[keyof typeof SkeletonVariant];

/* ─── Permission ─────────────────────────────────────────── */

export const PermissionStatus = {
  GRANTED: "GRANTED",
  DENIED: "DENIED",
  PROMPT: "PROMPT",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type PermissionStatusValue = (typeof PermissionStatus)[keyof typeof PermissionStatus];

/* ─── Chip ───────────────────────────────────────────────── */

export const ChipSize = {
  SM: "SM",
  MD: "MD",
  LG: "LG",
} as const;

export type ChipSizeValue = (typeof ChipSize)[keyof typeof ChipSize];

/* ─── Tabs ───────────────────────────────────────────────── */

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

/* ─── Dropdown ───────────────────────────────────────────── */

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
  disabled?: boolean;
}

/* ─── Context Menu ───────────────────────────────────────── */

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
  disabled?: boolean;
}

/* ─── Carousel ───────────────────────────────────────────── */

export interface CarouselItem {
  id: string;
  content: React.ReactNode;
}
