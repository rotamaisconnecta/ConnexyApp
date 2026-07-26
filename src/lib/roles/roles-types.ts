/* =========================================================
   roles-types.ts — Role & permission type definitions
   Pure TypeScript. No React. No side effects.
========================================================= */

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
  canCreateBusiness: boolean;
  canCreateOffer: boolean;
  canCreateEvent: boolean;
  canCreatePlace: boolean;
  canCreateReel: boolean;
  canPublishMoment: boolean;
  canPublishPhoto: boolean;
  canPublishVideo: boolean;
  canPublishText: boolean;
}

export interface RoleDefinition {
  role: UserRole;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

export interface RolesStorage {
  roles: UserRole[];
  activeMode: RoleMode;
}
