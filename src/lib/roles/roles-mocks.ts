/* ============================================================
   CONNEXY
   Phase 8.1
   Mock States
============================================================ */

import { UserRole, UserRolesState } from "./roles-types";

export const mockCommonUser: UserRolesState = {
  roles: [UserRole.USER],
  activeMode: UserRole.USER,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export const mockDriver: UserRolesState = {
  roles: [UserRole.USER, UserRole.DRIVER],
  activeMode: UserRole.DRIVER,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export const mockBusiness: UserRolesState = {
  roles: [UserRole.USER, UserRole.BUSINESS],
  activeMode: UserRole.BUSINESS,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export const mockDriverBusiness: UserRolesState = {
  roles: [UserRole.USER, UserRole.DRIVER, UserRole.BUSINESS],
  activeMode: UserRole.DRIVER,
  lastMode: UserRole.BUSINESS,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export const mockBusinessEvents: UserRolesState = {
  roles: [UserRole.USER, UserRole.BUSINESS, UserRole.EVENT_CREATOR],
  activeMode: UserRole.BUSINESS,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export const mockCreator: UserRolesState = {
  roles: [UserRole.USER, UserRole.REELS_CREATOR],
  activeMode: UserRole.USER,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export const mockAllRoles: UserRolesState = {
  roles: [
    UserRole.USER,
    UserRole.DRIVER,
    UserRole.BUSINESS,
    UserRole.EVENT_CREATOR,
    UserRole.PLACE_OWNER,
    UserRole.REELS_CREATOR,
  ],
  activeMode: UserRole.USER,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};
