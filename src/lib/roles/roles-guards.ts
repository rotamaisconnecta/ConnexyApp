/* =========================================================
   roles-guards.ts — Permission guard functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { getStoredRoles } from "./roles-storage";
import { getPermissionsForRoles } from "./roles-utils";

/* ─── getPermissions ────────────────────────────────────── */
// Convenience: reads current roles from storage and returns permissions

function getPermissions() {
  const { roles } = getStoredRoles();
  return getPermissionsForRoles(roles);
}

/* ─── Guard functions ───────────────────────────────────── */

export function canDrive(): boolean {
  return getPermissions().canDrive;
}

export function canPublishRide(): boolean {
  return getPermissions().canPublishRide;
}

export function canCreateOffer(): boolean {
  return getPermissions().canCreateOffer;
}

export function canCreateEvent(): boolean {
  return getPermissions().canCreateEvent;
}

export function canCreatePlace(): boolean {
  return getPermissions().canCreatePlace;
}

export function canCreateReel(): boolean {
  return getPermissions().canCreateReel;
}

export function canPublishPhoto(): boolean {
  return getPermissions().canPublishPhoto;
}

export function canPublishVideo(): boolean {
  return getPermissions().canPublishVideo;
}

export function canPublishText(): boolean {
  return getPermissions().canPublishText;
}

export function canPublishMoment(): boolean {
  return getPermissions().canPublishMoment;
}
