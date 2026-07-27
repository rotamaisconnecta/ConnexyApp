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

/* ─── Bottom Nav Config ──────────────────────────────────── */

export interface BottomNavConfig {
  leftItems: BottomNavItem[];
  centerItem: BottomNavItem;
  rightItems: BottomNavItem[];
}

const CENTER_ITEM: BottomNavItem = {
  id: "create",
  label: "Criar",
  icon: "Plus",
  route: "/create",
};

export function getBottomNavConfig(activeRole: UserRole): BottomNavConfig {
  switch (activeRole) {
    case UserRole.DRIVER:
      return {
        leftItems: [
          { id: "dashboard", label: "Painel", icon: "Car", route: "/driver" },
          { id: "map", label: "Mapa", icon: "Map", route: "/discover" },
        ],
        centerItem: CENTER_ITEM,
        rightItems: [
          { id: "rides", label: "Corridas", icon: "Navigation", route: "/driver" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
      };

    case UserRole.BUSINESS:
      return {
        leftItems: [
          { id: "feed", label: "Home", icon: "Home", route: "/feed" },
          { id: "marketplace", label: "Marketplace", icon: "Store", route: "/marketplace" },
        ],
        centerItem: CENTER_ITEM,
        rightItems: [
          { id: "chat", label: "Chat", icon: "MessageCircle", route: "/chat" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
      };

    case UserRole.EVENT_CREATOR:
      return {
        leftItems: [
          { id: "events", label: "Eventos", icon: "Calendar", route: "/events" },
          { id: "map", label: "Mapa", icon: "Map", route: "/discover" },
        ],
        centerItem: CENTER_ITEM,
        rightItems: [
          { id: "publications", label: "Publicações", icon: "FileText", route: "/feed" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
      };

    case UserRole.PLACE_OWNER:
      return {
        leftItems: [
          { id: "my-place", label: "Meu Local", icon: "MapPin", route: "/local" },
          { id: "map", label: "Mapa", icon: "Map", route: "/discover" },
        ],
        centerItem: CENTER_ITEM,
        rightItems: [
          { id: "marketplace", label: "Marketplace", icon: "Store", route: "/marketplace" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
      };

    case UserRole.REELS_CREATOR:
      return {
        leftItems: [
          { id: "feed", label: "Feed", icon: "Home", route: "/feed" },
          { id: "reels", label: "Reels", icon: "Film", route: "/reels" },
        ],
        centerItem: CENTER_ITEM,
        rightItems: [
          { id: "messages", label: "Mensagens", icon: "MessageCircle", route: "/chat" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
      };

    default:
      return {
        leftItems: [
          { id: "feed", label: "Home", icon: "Home", route: "/feed" },
          { id: "map", label: "Mapa", icon: "Map", route: "/discover" },
        ],
        centerItem: CENTER_ITEM,
        rightItems: [
          { id: "chat", label: "Chat", icon: "MessageCircle", route: "/chat" },
          { id: "profile", label: "Perfil", icon: "User", route: "/profile" },
        ],
      };
  }
}

/* ─── Map Filters per Role ───────────────────────────────── */

export function getMapFiltersForRole(activeRole: UserRole): MapFilter[] {
  switch (activeRole) {
    case UserRole.DRIVER:
      return [
        { id: "passengers", enabled: true },
        { id: "demand", enabled: true },
        { id: "hotspots", enabled: true },
        { id: "events", enabled: true },
      ];

    case UserRole.BUSINESS:
      return [
        { id: "customers", enabled: true },
        { id: "offers", enabled: true },
        { id: "businesses", enabled: true },
        { id: "traffic", enabled: true },
      ];

    case UserRole.EVENT_CREATOR:
      return [
        { id: "attendees", enabled: true },
        { id: "checkins", enabled: true },
        { id: "events", enabled: true },
      ];

    case UserRole.PLACE_OWNER:
      return [
        { id: "visitors", enabled: true },
        { id: "places", enabled: true },
        { id: "traffic", enabled: true },
      ];

    case UserRole.REELS_CREATOR:
      return [
        { id: "people", enabled: true },
        { id: "trending", enabled: true },
        { id: "reels", enabled: true },
      ];

    default:
      return [
        { id: "people", enabled: true },
        { id: "events", enabled: true },
        { id: "businesses", enabled: true },
        { id: "offers", enabled: true },
      ];
  }
}
