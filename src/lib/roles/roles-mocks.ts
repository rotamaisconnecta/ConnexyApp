/* ============================================================
   CONNEXY
   Phase 8.1
   Mock States
============================================================ */

import { UserRole, UserPermissions, RoleMode } from "./roles-types";
import { getPermissionsForRoles } from "./roles-utils";

export interface RoleMockState {
  roles: UserRole[];
  activeMode: RoleMode;
  permissions: UserPermissions;
}

export const mockCommonUser: RoleMockState = {
  roles: [UserRole.USER],
  activeMode: UserRole.USER,
  permissions: getPermissionsForRoles([UserRole.USER]),
};

export const mockDriver: RoleMockState = {
  roles: [UserRole.USER, UserRole.DRIVER],
  activeMode: UserRole.DRIVER,
  permissions: getPermissionsForRoles([UserRole.USER, UserRole.DRIVER]),
};

export const mockBusiness: RoleMockState = {
  roles: [UserRole.USER, UserRole.BUSINESS],
  activeMode: UserRole.BUSINESS,
  permissions: getPermissionsForRoles([UserRole.USER, UserRole.BUSINESS]),
};

export const mockDriverBusiness: RoleMockState = {
  roles: [UserRole.USER, UserRole.DRIVER, UserRole.BUSINESS],
  activeMode: UserRole.DRIVER,
  permissions: getPermissionsForRoles([UserRole.USER, UserRole.DRIVER, UserRole.BUSINESS]),
};

export const mockBusinessEvents: RoleMockState = {
  roles: [UserRole.USER, UserRole.BUSINESS, UserRole.EVENT_CREATOR],
  activeMode: UserRole.BUSINESS,
  permissions: getPermissionsForRoles([UserRole.USER, UserRole.BUSINESS, UserRole.EVENT_CREATOR]),
};

export const mockContentCreator: RoleMockState = {
  roles: [UserRole.USER, UserRole.REELS_CREATOR],
  activeMode: UserRole.USER,
  permissions: getPermissionsForRoles([UserRole.USER, UserRole.REELS_CREATOR]),
};

export const mockAllRoles: RoleMockState = {
  roles: [
    UserRole.USER,
    UserRole.DRIVER,
    UserRole.BUSINESS,
    UserRole.EVENT_CREATOR,
    UserRole.PLACE_OWNER,
    UserRole.REELS_CREATOR,
  ],
  activeMode: UserRole.USER,
  permissions: getPermissionsForRoles([
    UserRole.USER,
    UserRole.DRIVER,
    UserRole.BUSINESS,
    UserRole.EVENT_CREATOR,
    UserRole.PLACE_OWNER,
    UserRole.REELS_CREATOR,
  ]),
};
