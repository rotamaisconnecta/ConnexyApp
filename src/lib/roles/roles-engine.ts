/* ============================================================
   CONNEXY
   Phase 8.1
   Roles Engine
============================================================ */

import { UserRole } from "./roles-types";
import { getPermissionsForRoles } from "./roles-utils";

export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

export interface MapFilter {
  id: string;
  enabled: boolean;
}

export interface HomeShortcut {
  id: string;
  title: string;
  route: string;
}

export interface EngineConfiguration {
  bottomLeft: BottomNavItem[];
  bottomRight: BottomNavItem[];
  mapFilters: MapFilter[];
  shortcuts: HomeShortcut[];
  priorityModules: string[];
  createActions: string[];
}

export function getEngineConfiguration(activeRole: UserRole): EngineConfiguration {
  switch (activeRole) {
    case UserRole.DRIVER:
      return {
        bottomLeft: [
          { id: "dashboard", label: "Painel", icon: "Car", route: "/driver" },
          { id: "map", label: "Mapa", icon: "Map", route: "/discover" },
        ],
        bottomRight: [
          { id: "rides", label: "Corridas", icon: "Navigation", route: "/driver/rides" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
        mapFilters: [
          { id: "drivers", enabled: true },
          { id: "rides", enabled: true },
          { id: "events", enabled: true },
          { id: "people", enabled: true },
          { id: "offers", enabled: false },
        ],
        shortcuts: [
          { id: "online", title: "Ficar Online", route: "/driver" },
          { id: "earnings", title: "Ganhos", route: "/driver/finance" },
        ],
        priorityModules: ["rides", "hotspots", "events", "notifications"],
        createActions: ["ride", "moment", "photo", "video", "text", "reel"],
      };

    case UserRole.BUSINESS:
      return {
        bottomLeft: [
          { id: "feed", label: "Home", icon: "Home", route: "/feed" },
          { id: "marketplace", label: "Marketplace", icon: "Store", route: "/marketplace" },
        ],
        bottomRight: [
          { id: "chat", label: "Chat", icon: "MessageCircle", route: "/chat" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
        mapFilters: [
          { id: "offers", enabled: true },
          { id: "businesses", enabled: true },
          { id: "events", enabled: true },
          { id: "drivers", enabled: false },
          { id: "rides", enabled: false },
        ],
        shortcuts: [
          { id: "offers", title: "Minhas Ofertas", route: "/marketplace/manage" },
          { id: "analytics", title: "Relatórios", route: "/business/analytics" },
        ],
        priorityModules: ["marketplace", "offers", "events", "analytics"],
        createActions: ["offer", "place", "event", "photo", "video", "text", "moment", "reel"],
      };

    default:
      return {
        bottomLeft: [
          { id: "feed", label: "Home", icon: "Home", route: "/feed" },
          { id: "discover", label: "Mapa", icon: "Map", route: "/discover" },
        ],
        bottomRight: [
          { id: "chat", label: "Chat", icon: "MessageCircle", route: "/chat" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
        mapFilters: [
          { id: "people", enabled: true },
          { id: "events", enabled: true },
          { id: "businesses", enabled: true },
          { id: "drivers", enabled: true },
        ],
        shortcuts: [
          { id: "people", title: "Pessoas Próximas", route: "/people" },
          { id: "events", title: "Eventos", route: "/events" },
        ],
        priorityModules: ["feed", "people", "events", "reels"],
        createActions: ["photo", "video", "text", "moment", "reel"],
      };
  }
}

export function getCreateActionsForRoles(roles: UserRole[]): string[] {
  const permissions = getPermissionsForRoles(roles);
  const actions: string[] = ["photo", "video", "text", "moment", "reel"];

  if (permissions.canPublishRide) actions.push("ride");
  if (permissions.canCreateOffer) actions.push("offer");
  if (permissions.canCreatePlace) actions.push("place");
  if (permissions.canCreateEvent) actions.push("event");

  return actions;
}

export function getPriorityModules(activeRole: UserRole): string[] {
  return getEngineConfiguration(activeRole).priorityModules;
}

export function getBottomNavigation(activeRole: UserRole) {
  return {
    left: getEngineConfiguration(activeRole).bottomLeft,
    right: getEngineConfiguration(activeRole).bottomRight,
  };
}

export function getMapFilters(activeRole: UserRole) {
  return getEngineConfiguration(activeRole).mapFilters;
}

export function getShortcuts(activeRole: UserRole) {
  return getEngineConfiguration(activeRole).shortcuts;
}
