/* =========================================================
   roles-engine.ts — Maps roles to UI configurations
   Pure TypeScript. No React. No side effects.
========================================================= */

import { UserRole, type RoleMode } from "./roles-types";
import { getStoredRoles } from "./roles-storage";
import { getPermissionsForRoles } from "./roles-utils";

/* ─── BottomNav Item Config ─────────────────────────────── */

export interface NavItem {
  to: string;
  label: string;
  icon: string; // Lucide icon name
}

export interface BottomNavConfig {
  leftItems: NavItem[];
  rightItems: NavItem[];
}

const PASSENGER_NAV: BottomNavConfig = {
  leftItems: [
    { to: "/feed", label: "Início", icon: "House" },
    { to: "/discover", label: "Mapa", icon: "Map" },
  ],
  rightItems: [
    { to: "/chat", label: "Chat", icon: "MessageCircle" },
    { to: "/profile", label: "Perfil", icon: "User" },
  ],
};

const DRIVER_NAV: BottomNavConfig = {
  leftItems: [
    { to: "/driver", label: "Painel", icon: "LayoutDashboard" },
    { to: "/discover", label: "Mapa", icon: "Map" },
  ],
  rightItems: [
    { to: "/driver", label: "Corridas", icon: "Car" },
    { to: "/profile", label: "Perfil", icon: "User" },
  ],
};

const BUSINESS_NAV: BottomNavConfig = {
  leftItems: [
    { to: "/feed", label: "Início", icon: "House" },
    { to: "/marketplace", label: "Market", icon: "Store" },
  ],
  rightItems: [
    { to: "/chat", label: "Chat", icon: "MessageCircle" },
    { to: "/profile", label: "Perfil", icon: "User" },
  ],
};

/* ─── getBottomNavConfig ────────────────────────────────── */

export function getBottomNavConfig(mode: RoleMode): BottomNavConfig {
  switch (mode) {
    case UserRole.DRIVER:
      return DRIVER_NAV;
    case UserRole.BUSINESS:
      return BUSINESS_NAV;
    default:
      return PASSENGER_NAV;
  }
}

/* ─── getCreateActionsForRoles ──────────────────────────── */
// Returns which create categories the user can access

export function getCreateActionsForRoles(
  roles: UserRole[],
): { category: string; blocked: boolean }[] {
  const perms = getPermissionsForRoles(roles);
  const allCategories = [
    { category: "photo", blocked: !perms.canPublishPhoto },
    { category: "video", blocked: !perms.canPublishVideo },
    { category: "reel", blocked: !perms.canCreateReel },
    { category: "text", blocked: !perms.canPublishText },
    { category: "moment", blocked: !perms.canPublishMoment },
    { category: "offer", blocked: !perms.canCreateOffer },
    { category: "event", blocked: !perms.canCreateEvent },
    { category: "place", blocked: !perms.canCreatePlace },
    { category: "route", blocked: !perms.canPublishRide },
  ];
  return allCategories;
}

/* ─── getMapFilterForRole ───────────────────────────────── */

export interface MapFilter {
  label: string;
  value: string;
  emoji: string;
}

export function getMapFiltersForRole(mode: RoleMode): MapFilter[] {
  const base: MapFilter[] = [
    { label: "Pessoas", value: "people", emoji: "👥" },
    { label: "Locais", value: "places", emoji: "📍" },
  ];

  switch (mode) {
    case UserRole.DRIVER:
      return [
        ...base,
        { label: "Demanda", value: "demand", emoji: "🔥" },
        { label: "Hotspots", value: "hotspots", emoji: "🌡️" },
      ];
    case UserRole.BUSINESS:
      return [
        ...base,
        { label: "Clientes", value: "customers", emoji: "🧑‍💼" },
        { label: "Promoções", value: "promotions", emoji: "🏷️" },
      ];
    default:
      return base;
  }
}

/* ─── getCurrentRolesAndMode ────────────────────────────── */

export function getCurrentRolesAndMode() {
  return getStoredRoles();
}
