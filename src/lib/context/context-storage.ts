/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Storage
============================================================ */

import type { ContextState } from "./context-types";
import {
  ContextPeriod,
  ContextWeather,
  ContextMovement,
  ContextEnvironment,
} from "./context-types";
import { UserRole } from "@/lib/roles/roles-types";

const STORAGE_KEY = "connexy_context";

const DEFAULT_STATE: ContextState = {
  currentRole: UserRole.USER,
  currentLocation: "",
  environment: ContextEnvironment.HOME,
  movement: ContextMovement.CALM,
  weather: ContextWeather.SUNNY,
  period: ContextPeriod.MORNING,
  nearEvents: 0,
  nearBusinesses: 0,
  nearDrivers: 0,
  nearPeople: 0,
  hotArea: false,
};

export function getStoredContext(): ContextState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as ContextState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveContext(state: ContextState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearContext(): void {
  localStorage.removeItem(STORAGE_KEY);
}
