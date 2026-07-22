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
    route: "/",
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
    description: "Compartilhe um momento",
    route: "/create-post?category=photo",
  },
  {
    id: CreateCategory.VIDEO,
    emoji: "🎥",
    label: "Vídeo",
    description: "Grave um vídeo curto",
    route: "/create-post?category=video",
  },
  {
    id: CreateCategory.REEL,
    emoji: "▶",
    label: "Reel",
    description: "Crie um reel criativo",
    route: "/create-post?category=reel",
  },
  {
    id: CreateCategory.TEXT,
    emoji: "✍",
    label: "Texto",
    description: "Escreva uma publicação",
    route: "/create-post?category=text",
  },
  {
    id: CreateCategory.MOMENT,
    emoji: "⚡",
    label: "Momento",
    description: "Compartilhe agora",
    route: "/create-post?category=moment",
  },
  {
    id: CreateCategory.PLACE,
    emoji: "📍",
    label: "Local",
    description: "Marque um lugar",
    route: "/create-post?category=place",
  },
  {
    id: CreateCategory.EVENT,
    emoji: "🎉",
    label: "Evento",
    description: "Crie um evento",
    route: "/create-post?category=event",
  },
  {
    id: CreateCategory.OFFER,
    emoji: "🏷",
    label: "Oferta",
    description: "Publique uma promoção",
    route: "/create-post?category=offer",
  },
  {
    id: CreateCategory.ROUTE,
    emoji: "🚗",
    label: "Carona",
    description: "Compartilhe uma rota",
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
