/* =========================================================
   roles-storage.ts — localStorage persistence for roles
   Pure TypeScript. No React. No side effects.
========================================================= */

import { UserRole, type RoleMode, type RolesStorage } from "./roles-types";

const STORAGE_KEY = "connexy_roles";

const DEFAULT_STATE: RolesStorage = {
  roles: [UserRole.USER],
  activeMode: UserRole.USER,
};

/* ─── getStoredRoles ────────────────────────────────────── */

export function getStoredRoles(): RolesStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<RolesStorage>;

    const roles = Array.isArray(parsed.roles) ? parsed.roles : [UserRole.USER];
    const validRoles = roles.filter((r) => Object.values(UserRole).includes(r as UserRole));
    if (validRoles.length === 0) validRoles.push(UserRole.USER);

    const activeMode =
      parsed.activeMode && Object.values(UserRole).includes(parsed.activeMode as UserRole)
        ? (parsed.activeMode as RoleMode)
        : UserRole.USER;

    return { roles: validRoles as UserRole[], activeMode: activeMode as RoleMode };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/* ─── setStoredRoles ────────────────────────────────────── */

export function setStoredRoles(data: RolesStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/* ─── addRole ───────────────────────────────────────────── */

export function addRole(role: UserRole): RolesStorage {
  const current = getStoredRoles();
  if (current.roles.includes(role)) return current;
  const updated: RolesStorage = {
    roles: [...current.roles, role],
    activeMode: current.activeMode,
  };
  setStoredRoles(updated);
  return updated;
}

/* ─── removeRole ────────────────────────────────────────── */

export function removeRole(role: UserRole): RolesStorage {
  if (role === UserRole.USER) return getStoredRoles(); // Cannot remove USER
  const current = getStoredRoles();
  const updatedRoles = current.roles.filter((r) => r !== role);
  if (updatedRoles.length === 0) updatedRoles.push(UserRole.USER); // Always keep USER
  const updated: RolesStorage = {
    roles: updatedRoles,
    activeMode: current.activeMode === role ? UserRole.USER : current.activeMode,
  };
  setStoredRoles(updated);
  return updated;
}

/* ─── setActiveMode ─────────────────────────────────────── */

export function setActiveMode(mode: RoleMode): RolesStorage {
  const current = getStoredRoles();
  if (!current.roles.includes(mode)) return current;
  const updated: RolesStorage = { ...current, activeMode: mode };
  setStoredRoles(updated);
  return updated;
}

/* ─── getActiveMode ─────────────────────────────────────── */

export function getActiveMode(): RoleMode {
  return getStoredRoles().activeMode;
}

/* ─── hasRole ───────────────────────────────────────────── */

export function hasRole(role: UserRole): boolean {
  return getStoredRoles().roles.includes(role);
}

/* ─── resetRoles ────────────────────────────────────────── */

export function resetRoles(): void {
  setStoredRoles({ ...DEFAULT_STATE });
}
