/* =========================================================
   roles-utils.ts — Permission computation & role helpers
   Pure TypeScript. No React. No side effects.
========================================================= */

import { UserRole, type UserPermissions, type RoleDefinition } from "./roles-types";

export type PermissionsMap = Record<keyof UserPermissions, boolean>;

/* ─── Role Definitions ──────────────────────────────────── */

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: UserRole.USER,
    title: "Usuário",
    description: "Explore, conecte-se e compartilhe",
    emoji: "👤",
    color: "#6366f1",
  },
  {
    role: UserRole.DRIVER,
    title: "Motorista",
    description: "Ganhe dinheiro fazendo viagens",
    emoji: "🚗",
    color: "#22c55e",
  },
  {
    role: UserRole.BUSINESS,
    title: "Empresa",
    description: "Divulgue seu negócio e ofertas",
    emoji: "🏪",
    color: "#f59e0b",
  },
  {
    role: UserRole.EVENT_CREATOR,
    title: "Organizador de Eventos",
    description: "Crie e promova eventos",
    emoji: "🎉",
    color: "#ec4899",
  },
  {
    role: UserRole.PLACE_OWNER,
    title: "Proprietário de Local",
    description: "Cadastre e gerencie locais",
    emoji: "📍",
    color: "#ef4444",
  },
  {
    role: UserRole.REELS_CREATOR,
    title: "Criador de Conteúdo",
    description: "Crie reels e conteúdo viral",
    emoji: "🎥",
    color: "#8b5cf6",
  },
];

/* ─── getRoleDefinition ─────────────────────────────────── */

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS.find((r) => r.role === role) ?? ROLE_DEFINITIONS[0];
}

/* ─── getAllRoleDefinitions ──────────────────────────────── */

export function getAllRoleDefinitions(): RoleDefinition[] {
  return [...ROLE_DEFINITIONS];
}

/* ─── getActivatableRoles ───────────────────────────────── */
// Roles the user can activate (excludes USER which is always active)

export function getActivatableRoles(): RoleDefinition[] {
  return ROLE_DEFINITIONS.filter((r) => r.role !== UserRole.USER);
}

/* ─── getRoleLabel ──────────────────────────────────────── */

export function getRoleLabel(role: UserRole): string {
  return getRoleDefinition(role).title;
}

/* ─── getRoleEmoji ──────────────────────────────────────── */

export function getRoleEmoji(role: UserRole): string {
  return getRoleDefinition(role).emoji;
}

/* ─── getPermissionsForRoles ────────────────────────────── */

export function getPermissionsForRoles(roles: UserRole[]): UserPermissions {
  const has = (role: UserRole) => roles.includes(role);

  return {
    canDrive: has(UserRole.DRIVER),
    canPublishRide: has(UserRole.DRIVER),
    canCreateBusiness: has(UserRole.BUSINESS),
    canCreateOffer: has(UserRole.BUSINESS),
    canCreateEvent: has(UserRole.EVENT_CREATOR),
    canCreatePlace: has(UserRole.PLACE_OWNER),
    canCreateReel: true,
    canPublishMoment: true,
    canPublishPhoto: true,
    canPublishVideo: true,
    canPublishText: true,
  };
}

/* ─── canUserCreateCategory ─────────────────────────────── */

export function canUserCreateCategory(category: string, permissions: UserPermissions): boolean {
  switch (category.toLowerCase()) {
    case "photo":
      return permissions.canPublishPhoto;
    case "video":
      return permissions.canPublishVideo;
    case "reel":
      return permissions.canCreateReel;
    case "text":
      return permissions.canPublishText;
    case "moment":
      return permissions.canPublishMoment;
    case "offer":
      return permissions.canCreateOffer;
    case "event":
      return permissions.canCreateEvent;
    case "place":
      return permissions.canCreatePlace;
    case "route":
      return permissions.canPublishRide;
    default:
      return false;
  }
}

/* ─── getBlockedCategoryMessage ─────────────────────────── */

export function getBlockedCategoryMessage(category: string): {
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
} {
  switch (category.toLowerCase()) {
    case "offer":
      return {
        title: "Cadastre sua empresa",
        description: "Para publicar ofertas, ative a função Empresa nas configurações.",
        ctaLabel: "Ativar Empresa",
        ctaRoute: "/profile/roles",
      };
    case "event":
      return {
        title: "Ative Organizador de Eventos",
        description: "Para criar eventos, ative esta função nas configurações.",
        ctaLabel: "Ativar Organizador",
        ctaRoute: "/profile/roles",
      };
    case "place":
      return {
        title: "Ative Proprietário de Local",
        description: "Para cadastrar locais, ative esta função nas configurações.",
        ctaLabel: "Ativar Proprietário",
        ctaRoute: "/profile/roles",
      };
    case "route":
      return {
        title: "Cadastre-se como Motorista",
        description: "Para oferecer caronas, ative a função Motorista nas configurações.",
        ctaLabel: "Ativar Motorista",
        ctaRoute: "/profile/roles",
      };
    default:
      return {
        title: "Função não disponível",
        description: "Ative esta função para acessar este recurso.",
        ctaLabel: "Ativar",
        ctaRoute: "/profile/roles",
      };
  }
}
