/* =========================================================
   roles-mocks.ts — Mock role states for testing
   Pure TypeScript. No React. No side effects.
========================================================= */

import { UserRole, type RolesStorage } from "./roles-types";

/* ─── Mock States ───────────────────────────────────────── */

export const mockCommonUser: RolesStorage = {
  roles: [UserRole.USER],
  activeMode: UserRole.USER,
};

export const mockDriver: RolesStorage = {
  roles: [UserRole.USER, UserRole.DRIVER],
  activeMode: UserRole.DRIVER,
};

export const mockBusiness: RolesStorage = {
  roles: [UserRole.USER, UserRole.BUSINESS],
  activeMode: UserRole.BUSINESS,
};

export const mockDriverBusiness: RolesStorage = {
  roles: [UserRole.USER, UserRole.DRIVER, UserRole.BUSINESS],
  activeMode: UserRole.DRIVER,
};

export const mockBusinessEvents: RolesStorage = {
  roles: [UserRole.USER, UserRole.BUSINESS, UserRole.EVENT_CREATOR],
  activeMode: UserRole.BUSINESS,
};

export const mockContentCreator: RolesStorage = {
  roles: [UserRole.USER, UserRole.REELS_CREATOR],
  activeMode: UserRole.USER,
};

export const mockAllRoles: RolesStorage = {
  roles: [
    UserRole.USER,
    UserRole.DRIVER,
    UserRole.BUSINESS,
    UserRole.EVENT_CREATOR,
    UserRole.PLACE_OWNER,
    UserRole.REELS_CREATOR,
  ],
  activeMode: UserRole.USER,
};

/* ─── All mocks map ─────────────────────────────────────── */

export const ALL_MOCK_STATES = {
  commonUser: mockCommonUser,
  driver: mockDriver,
  business: mockBusiness,
  driverBusiness: mockDriverBusiness,
  businessEvents: mockBusinessEvents,
  contentCreator: mockContentCreator,
  allRoles: mockAllRoles,
} as const;
