/* =========================================================
   navigation-items.ts — Navigation item definitions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { NavigationItem, CreateActionItem, NavigationTabValue } from "./navigation-types";
import { NavigationTab, CreateCategory } from "./navigation-types";

/* ─── NAVIGATION_ITEMS ──────────────────────────────────── */

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: NavigationTab.HOME,
    label: "Início",
    icon: "House",
    route: "/home",
  },
  {
    id: NavigationTab.MAP,
    label: "Mapa",
    icon: "Map",
    route: "/discover",
  },
  {
    id: NavigationTab.CREATE,
    label: "Criar",
    icon: "Plus",
    route: "",
  },
  {
    id: NavigationTab.CHAT,
    label: "Chat",
    icon: "MessageCircle",
    route: "/chat",
  },
  {
    id: NavigationTab.PROFILE,
    label: "Perfil",
    icon: "User",
    route: "/profile",
  },
];

/* ─── CREATE_ACTIONS ────────────────────────────────────── */

export const CREATE_ACTIONS: CreateActionItem[] = [
  {
    id: CreateCategory.PHOTO,
    emoji: "📷",
    label: "Foto",
    description: "Compartilhe uma foto",
    route: "/create?category=photo",
  },
  {
    id: CreateCategory.VIDEO,
    emoji: "🎥",
    label: "Vídeo",
    description: "Grave ou envie um vídeo",
    route: "/create?category=video",
  },
  {
    id: CreateCategory.REEL,
    emoji: "▶",
    label: "Reel",
    description: "Vídeos curtos",
    route: "/create?category=reel",
  },
  {
    id: CreateCategory.TEXT,
    emoji: "✍",
    label: "Texto",
    description: "Compartilhe uma ideia",
    route: "/create?category=text",
  },
  {
    id: CreateCategory.PLACE,
    emoji: "📍",
    label: "Local",
    description: "Cadastrar um lugar",
    route: "/create?category=place",
  },
  {
    id: CreateCategory.EVENT,
    emoji: "🎉",
    label: "Evento",
    description: "Criar evento",
    route: "/create?category=event",
  },
  {
    id: CreateCategory.OFFER,
    emoji: "🏷",
    label: "Oferta",
    description: "Criar oferta",
    route: "/create?category=offer",
  },
  {
    id: CreateCategory.ROUTE,
    emoji: "🚗",
    label: "Carona",
    description: "Oferecer ou pedir carona",
    route: "/create?category=route",
  },
];

/* ─── getItemById ───────────────────────────────────────── */

export function getItemById(id: NavigationTabValue): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find((item) => item.id === id);
}

/* ─── getCreateActionById ───────────────────────────────── */

export function getCreateActionById(id: string): CreateActionItem | undefined {
  return CREATE_ACTIONS.find((action) => action.id === id);
}
