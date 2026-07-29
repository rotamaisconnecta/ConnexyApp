/* ============================================================
   CONNEXY
   Phase 8.1
   Multi Role System
============================================================ */

import { UserRole, UserPermissions, RoleDefinition } from "./roles-types";

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: UserRole.USER,
    label: "Usuário",
    emoji: "👤",
    color: "#6C3BFF",
    description: "Modo padrão do Connexy",
  },
  {
    id: UserRole.DRIVER,
    label: "Motorista",
    emoji: "🚗",
    color: "#22C55E",
    description: "Receba solicitações de corrida",
  },
  {
    id: UserRole.BUSINESS,
    label: "Negócio",
    emoji: "🏢",
    color: "#F59E0B",
    description: "Cadastre sua empresa ou estabelecimento",
  },
  {
    id: UserRole.EVENT_CREATOR,
    label: "Organizador",
    emoji: "🎉",
    color: "#EC4899",
    description: "Crie e administre eventos",
  },
  {
    id: UserRole.PLACE_OWNER,
    label: "Local",
    emoji: "📍",
    color: "#3B82F6",
    description: "Cadastre e administre locais",
  },
  {
    id: UserRole.REELS_CREATOR,
    label: "Criador",
    emoji: "🎬",
    color: "#8B5CF6",
    description: "Produza conteúdo em vídeo",
  },
];

export function getRoleDefinition(role: UserRole) {
  return ROLE_DEFINITIONS.find((r) => r.id === role);
}

export function getAllRoleDefinitions() {
  return ROLE_DEFINITIONS;
}

export function getRoleLabel(role: UserRole): string {
  return getRoleDefinition(role)?.label ?? "";
}

export function getRoleEmoji(role: UserRole): string {
  return getRoleDefinition(role)?.emoji ?? "";
}

export function getPermissionsForRoles(roles: UserRole[]): UserPermissions {
  const isDriver = roles.includes(UserRole.DRIVER);
  const isBusiness = roles.includes(UserRole.BUSINESS);
  const isEventCreator = roles.includes(UserRole.EVENT_CREATOR);
  const isPlaceOwner = roles.includes(UserRole.PLACE_OWNER);

  return {
    canDrive: isDriver,
    canPublishRide: isDriver,
    canReceiveRide: isDriver,
    canCreateBusiness: isBusiness,
    canCreateOffer: isBusiness,
    canManageCoupons: isBusiness,
    canManageEmployees: isBusiness,
    canCreateCampaigns: isBusiness,
    canReceivePayments: isBusiness,
    canAccessBusinessDashboard: isBusiness,
    canSeeAnalytics: isBusiness,
    canCreateEvent: isEventCreator,
    canManageEvents: isEventCreator,
    canCreatePlace: isPlaceOwner,
    canCreateReel: true,
    canPublishMoment: true,
    canPublishPhoto: true,
    canPublishVideo: true,
    canPublishText: true,
    canAccessDriverDashboard: isDriver,
    canModerateCommunity: false,
  };
}

export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: UserRole[], list: UserRole[]): boolean {
  return list.some((r) => roles.includes(r));
}

export function hasAllRoles(roles: UserRole[], list: UserRole[]): boolean {
  return list.every((r) => roles.includes(r));
}

export function getPrimaryRole(roles: UserRole[]): UserRole {
  if (roles.includes(UserRole.DRIVER)) return UserRole.DRIVER;
  if (roles.includes(UserRole.BUSINESS)) return UserRole.BUSINESS;
  return UserRole.USER;
}

export function canActivateRole(roles: UserRole[], role: UserRole): boolean {
  return !roles.includes(role);
}

export function activateRole(roles: UserRole[], role: UserRole): UserRole[] {
  if (roles.includes(role)) return roles;
  return [...roles, role];
}

export function deactivateRole(roles: UserRole[], role: UserRole): UserRole[] {
  if (role === UserRole.USER) return roles;
  return roles.filter((r) => r !== role);
}

export function getActivatableRoles(): RoleDefinition[] {
  return ROLE_DEFINITIONS.filter((r) => r.id !== UserRole.USER);
}

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

export function getBlockedCategoryMessage(category: string): {
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
} {
  switch (category.toLowerCase()) {
    case "offer":
      return {
        title: "Crie seu negócio",
        description: "Para publicar ofertas, cadastre seu negócio primeiro.",
        ctaLabel: "Criar Negócio",
        ctaRoute: "/create/place-business",
      };
    case "event":
      return {
        title: "Crie seu evento",
        description: "Para criar eventos, acesse a criação de eventos.",
        ctaLabel: "Criar Evento",
        ctaRoute: "/create/event",
      };
    case "place":
      return {
        title: "Cadastre seu local",
        description: "Para cadastrar locais, acesse a criação de locais.",
        ctaLabel: "Cadastrar Local",
        ctaRoute: "/create/place",
      };
    case "route":
      return {
        title: "Cadastre-se como Motorista",
        description: "Para oferecer corridas, cadastre-se como motorista.",
        ctaLabel: "Ser Motorista",
        ctaRoute: "/driver",
      };
    default:
      return {
        title: "Crie seu recurso",
        description: "Crie este recurso para acessar esta funcionalidade.",
        ctaLabel: "Criar",
        ctaRoute: "/profile/roles",
      };
  }
}
