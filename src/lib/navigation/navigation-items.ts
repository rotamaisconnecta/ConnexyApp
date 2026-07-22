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
    route: "/feed",
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
    route: "/create-post?category=photo",
  },
  {
    id: CreateCategory.VIDEO,
    emoji: "🎥",
    label: "Vídeo",
    description: "Grave ou envie um vídeo",
    route: "/create-post?category=video",
  },
  {
    id: CreateCategory.REEL,
    emoji: "▶",
    label: "Reel",
    description: "Vídeos curtos",
    route: "/create-post?category=reel",
  },
  {
    id: CreateCategory.TEXT,
    emoji: "✍",
    label: "Texto",
    description: "Compartilhe uma ideia",
    route: "/create-post?category=text",
  },
  {
    id: CreateCategory.MOMENT,
    emoji: "⚡",
    label: "Momento",
    description: "Compartilhe o que está acontecendo agora",
    route: "/create-post?category=moment",
  },
  {
    id: CreateCategory.PLACE,
    emoji: "📍",
    label: "Local",
    description: "Cadastrar um lugar",
    route: "/create-post?category=place",
  },
  {
    id: CreateCategory.EVENT,
    emoji: "🎉",
    label: "Evento",
    description: "Criar evento",
    route: "/create-post?category=event",
  },
  {
    id: CreateCategory.OFFER,
    emoji: "🏷",
    label: "Oferta",
    description: "Criar oferta",
    route: "/create-post?category=offer",
  },
  {
    id: CreateCategory.ROUTE,
    emoji: "🚗",
    label: "Carona",
    description: "Oferecer ou pedir carona",
    route: "/create-post?category=route",
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
