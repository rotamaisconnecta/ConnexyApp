/* =========================================================
   navigation-types.ts — Navigation type definitions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── NavigationTab ─────────────────────────────────────── */

export const NavigationTab = {
  HOME: "HOME",
  MAP: "MAP",
  CREATE: "CREATE",
  CHAT: "CHAT",
  PROFILE: "PROFILE",
} as const;

export type NavigationTabValue = (typeof NavigationTab)[keyof typeof NavigationTab];

/* ─── CreateCategory ────────────────────────────────────── */

export const CreateCategory = {
  PHOTO: "PHOTO",
  VIDEO: "VIDEO",
  REEL: "REEL",
  TEXT: "TEXT",
  MOMENT: "MOMENT",
  PLACE: "PLACE",
  EVENT: "EVENT",
  OFFER: "OFFER",
  ROUTE: "ROUTE",
} as const;

export type CreateCategoryValue = (typeof CreateCategory)[keyof typeof CreateCategory];

/* ─── NavigationItem ────────────────────────────────────── */

export interface NavigationItem {
  id: NavigationTabValue;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

/* ─── CreateActionItem ──────────────────────────────────── */

export interface CreateActionItem {
  id: CreateCategoryValue;
  emoji: string;
  label: string;
  description: string;
  route: string;
}
