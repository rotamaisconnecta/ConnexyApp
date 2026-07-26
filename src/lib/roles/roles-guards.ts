/* ============================================================
   CONNEXY
   Phase 8.1
   Roles Guards
============================================================ */

import { UserRole } from "./roles-types";
import { getPermissionsForRoles } from "./roles-utils";

export function canDrive(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canDrive;
}

export function canPublishRide(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canPublishRide;
}

export function canReceiveRide(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canReceiveRide;
}

export function canCreateBusiness(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canCreateBusiness;
}

export function canCreateOffer(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canCreateOffer;
}

export function canCreateEvent(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canCreateEvent;
}

export function canCreatePlace(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canCreatePlace;
}

export function canCreateReel(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canCreateReel;
}

export function canPublishPhoto(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canPublishPhoto;
}

export function canPublishVideo(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canPublishVideo;
}

export function canPublishText(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canPublishText;
}

export function canPublishMoment(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canPublishMoment;
}

export function canAccessDriverDashboard(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canAccessDriverDashboard;
}

export function canAccessBusinessDashboard(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canAccessBusinessDashboard;
}

export function canManageCoupons(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canManageCoupons;
}

export function canManageEmployees(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canManageEmployees;
}

export function canManageCampaigns(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canCreateCampaigns;
}

export function canSeeAnalytics(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canSeeAnalytics;
}

export function canReceivePayments(roles: UserRole[]): boolean {
  return getPermissionsForRoles(roles).canReceivePayments;
}

export function isCommonUser(roles: UserRole[]): boolean {
  return roles.length === 1 && roles.includes(UserRole.USER);
}

export function isDriver(roles: UserRole[]): boolean {
  return roles.includes(UserRole.DRIVER);
}

export function isBusiness(roles: UserRole[]): boolean {
  return roles.includes(UserRole.BUSINESS);
}

export function isEventCreator(roles: UserRole[]): boolean {
  return roles.includes(UserRole.EVENT_CREATOR);
}

export function isPlaceOwner(roles: UserRole[]): boolean {
  return roles.includes(UserRole.PLACE_OWNER);
}

export function isContentCreator(roles: UserRole[]): boolean {
  return roles.includes(UserRole.REELS_CREATOR);
}
