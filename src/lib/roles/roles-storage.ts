/* ============================================================
   CONNEXY
   Phase 8.1
   Multi Role System
============================================================ */

import { UserRole, RoleMode, UserRolesState } from "./roles-types";

const STORAGE_KEY = "connexy_roles";

const DEFAULT_STATE: UserRolesState = {
  roles: [UserRole.USER],
  activeMode: UserRole.USER,
  lastMode: UserRole.USER,
  activatedAt: new Date().toISOString(),
  preferences: {
    rememberLastMode: true,
    showRoleSuggestions: true,
  },
};

export function getStoredRoles(): UserRolesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveRoles(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
    return JSON.parse(raw);
  } catch {
    saveRoles(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
}

export function saveRoles(state: UserRolesState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getRoles(): UserRole[] {
  return getStoredRoles().roles;
}

export function getActiveMode(): RoleMode {
  return getStoredRoles().activeMode;
}

export function getLastMode(): RoleMode {
  return getStoredRoles().lastMode;
}

export function setActiveMode(mode: RoleMode): void {
  const state = getStoredRoles();
  state.lastMode = state.activeMode;
  state.activeMode = mode;
  saveRoles(state);
}

export function addRole(role: UserRole) {
  const state = getStoredRoles();
  if (!state.roles.includes(role)) {
    state.roles.push(role);
    saveRoles(state);
  }
}

export function removeRole(role: UserRole): void {
  if (role === UserRole.USER) return;
  const state = getStoredRoles();
  state.roles = state.roles.filter((r) => r !== role);
  if (!state.roles.includes(state.activeMode)) {
    state.activeMode = UserRole.USER;
  }
  saveRoles(state);
}

export function hasRole(role: UserRole): boolean {
  return getStoredRoles().roles.includes(role);
}

export function clearRoles() {
  localStorage.removeItem(STORAGE_KEY);
}

export function toggleRole(role: UserRole) {
  if (hasRole(role)) {
    removeRole(role);
  } else {
    addRole(role);
  }
}

export function updatePreferences(
  rememberLastMode: boolean,
  showRoleSuggestions: boolean,
) {
  const state = getStoredRoles();
  state.preferences.rememberLastMode = rememberLastMode;
  state.preferences.showRoleSuggestions = showRoleSuggestions;
  saveRoles(state);
}

export function restoreLastMode() {
  const state = getStoredRoles();
  if (state.preferences.rememberLastMode && state.roles.includes(state.lastMode)) {
    state.activeMode = state.lastMode;
    saveRoles(state);
  }
}

export function resetRoles() {
  saveRoles(DEFAULT_STATE);
}
