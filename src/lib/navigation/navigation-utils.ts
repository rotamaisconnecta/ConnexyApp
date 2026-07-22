/* =========================================================
   navigation-utils.ts — Pure navigation utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { NavigationTabValue } from "./navigation-types";
import { NavigationTab } from "./navigation-types";
import { NAVIGATION_ITEMS, CREATE_ACTIONS } from "./navigation-items";

/* ─── isActiveRoute ─────────────────────────────────────── */

export function isActiveRoute(pathname: string, route: string): boolean {
  if (!route) return false;
  if (pathname === route) return true;
  return pathname.startsWith(route + "/");
}

/* ─── getActiveTab ──────────────────────────────────────── */

export function getActiveTab(pathname: string): NavigationTabValue | null {
  for (const item of NAVIGATION_ITEMS) {
    if (item.id === NavigationTab.CREATE) continue;
    if (item.id === NavigationTab.MAP) {
      if (pathname === "/") return item.id;
      continue;
    }
    if (isActiveRoute(pathname, item.route)) {
      return item.id;
    }
  }
  return null;
}

/* ─── getNavigationItem ─────────────────────────────────── */

export function getNavigationItem(id: NavigationTabValue) {
  return NAVIGATION_ITEMS.find((item) => item.id === id) ?? null;
}

/* ─── getNavigationRoute ────────────────────────────────── */

export function getNavigationRoute(id: NavigationTabValue): string {
  const item = getNavigationItem(id);
  return item?.route ?? "/";
}

/* ─── getCreateActions ──────────────────────────────────── */

export function getCreateActions() {
  return CREATE_ACTIONS;
}

/* ─── getCreateActionByCategory ─────────────────────────── */

export function getCreateActionByCategory(category: string) {
  return (
    CREATE_ACTIONS.find((action) => action.id.toLowerCase() === category.toLowerCase()) ?? null
  );
}

/* ─── getUnreadBadgeCount ───────────────────────────────── */

export function getUnreadBadgeCount(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}
