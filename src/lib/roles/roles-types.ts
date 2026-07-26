/* ============================================================
   CONNEXY
   Phase 8.1
   Multi Role System
============================================================ */

export enum UserRole {
  USER = "USER",
  DRIVER = "DRIVER",
  BUSINESS = "BUSINESS",
  EVENT_CREATOR = "EVENT_CREATOR",
  PLACE_OWNER = "PLACE_OWNER",
  REELS_CREATOR = "REELS_CREATOR",
}

export type RoleMode = UserRole.USER | UserRole.DRIVER | UserRole.BUSINESS;

export interface UserPermissions {
  canDrive: boolean;
  canPublishRide: boolean;
  canReceiveRide: boolean;
  canCreateBusiness: boolean;
  canCreateOffer: boolean;
  canManageCoupons: boolean;
  canManageEmployees: boolean;
  canCreateCampaigns: boolean;
  canCreateEvent: boolean;
  canManageEvents: boolean;
  canCreatePlace: boolean;
  canCreateReel: boolean;
  canPublishMoment: boolean;
  canPublishPhoto: boolean;
  canPublishVideo: boolean;
  canPublishText: boolean;
  canAccessDriverDashboard: boolean;
  canAccessBusinessDashboard: boolean;
  canSeeAnalytics: boolean;
  canModerateCommunity: boolean;
  canReceivePayments: boolean;
}

export interface RoleDefinition {
  id: UserRole;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export interface UserRolesState {
  roles: UserRole[];
  activeMode: RoleMode;
  activatedAt: string;
  lastMode: RoleMode;
  preferences: {
    rememberLastMode: boolean;
    showRoleSuggestions: boolean;
  };
}

export interface BottomNavConfiguration {
  left: string[];
  center: string[];
  right: string[];
}

export interface CreatePermission {
  id: string;
  allowed: boolean;
  requiredRole?: UserRole;
  reason?: string;
}
