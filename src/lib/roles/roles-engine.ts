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

/* ─── Create Actions for Roles ───────────────────────────── */

export interface CreateAction {
  id: string;
  title: string;
  emoji: string;
  icon: string;
  route: string;
  enabled: boolean;
  requiredRole: UserRole | null;
  lockedReason: string | null;
}

const ALL_CREATE_ACTIONS: Omit<CreateAction, "enabled">[] = [
  {
    id: "photo",
    title: "Foto",
    emoji: "📷",
    icon: "Camera",
    route: "/create/photo",
    requiredRole: null,
    lockedReason: null,
  },
  {
    id: "video",
    title: "Vídeo",
    emoji: "🎥",
    icon: "Video",
    route: "/create/video",
    requiredRole: null,
    lockedReason: null,
  },
  {
    id: "text",
    title: "Texto",
    emoji: "✍",
    icon: "Type",
    route: "/create/text",
    requiredRole: null,
    lockedReason: null,
  },
  {
    id: "moment",
    title: "Momento",
    emoji: "⚡",
    icon: "Zap",
    route: "/create/moment",
    requiredRole: null,
    lockedReason: null,
  },
  {
    id: "reel",
    title: "Reel",
    emoji: "▶",
    icon: "Film",
    route: "/create/reel",
    requiredRole: null,
    lockedReason: null,
  },
  {
    id: "offer",
    title: "Oferta",
    emoji: "🏷",
    icon: "Tag",
    route: "/create/offer",
    requiredRole: UserRole.BUSINESS,
    lockedReason: "Cadastre sua empresa para publicar ofertas.",
  },
  {
    id: "event",
    title: "Evento",
    emoji: "🎉",
    icon: "CalendarDays",
    route: "/create/event",
    requiredRole: UserRole.EVENT_CREATOR,
    lockedReason: "Ative a função Organizador para criar eventos.",
  },
  {
    id: "ride",
    title: "Carona",
    emoji: "🚗",
    icon: "Car",
    route: "/create/ride",
    requiredRole: UserRole.DRIVER,
    lockedReason: "Cadastre-se como motorista para oferecer caronas.",
  },
  {
    id: "place",
    title: "Local",
    emoji: "📍",
    icon: "MapPin",
    route: "/create/place",
    requiredRole: UserRole.PLACE_OWNER,
    lockedReason: "Ative a função Proprietário para cadastrar locais.",
  },
];

function isActionEnabled(id: string, roles: UserRole[]): boolean {
  const permissions = getPermissionsForRoles(roles);
  switch (id) {
    case "photo":
      return permissions.canPublishPhoto;
    case "video":
      return permissions.canPublishVideo;
    case "text":
      return permissions.canPublishText;
    case "moment":
      return permissions.canPublishMoment;
    case "reel":
      return permissions.canCreateReel;
    case "ride":
      return permissions.canPublishRide;
    case "offer":
      return permissions.canCreateOffer;
    case "event":
      return permissions.canCreateEvent;
    case "place":
      return permissions.canCreatePlace;
    default:
      return false;
  }
}

export function getCreateActionsForRoles(roles: UserRole[]): CreateAction[] {
  return ALL_CREATE_ACTIONS.map((action) => ({
    ...action,
    enabled: isActionEnabled(action.id, roles),
  }));
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
