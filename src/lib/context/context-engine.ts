/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Engine
============================================================ */

import type { UserRole } from "@/lib/roles/roles-types";
import { getActiveMode } from "@/lib/roles/roles-storage";
import type { ContextState, ContextRecommendation } from "./context-types";
import { getStoredContext, saveContext } from "./context-storage";
import {
  detectPeriod,
  detectWeather,
  detectMovement,
  detectEnvironment,
  detectNearby,
  detectHotArea,
  detectLocationName,
} from "./context-detector";
import {
  getEnvironmentRecommendations,
  getPeriodEmphasis,
  getMovementModifiers,
} from "./context-rules";

/* ─── getCurrentContext ─────────────────────────────────── */

export function getCurrentContext(): ContextState {
  const stored = getStoredContext();
  const role = getActiveMode() as UserRole;
  const environment = detectEnvironment();
  const nearby = detectNearby();

  return {
    ...stored,
    currentRole: role,
    currentLocation: detectLocationName(environment),
    environment,
    movement: detectMovement(),
    weather: detectWeather(),
    period: detectPeriod(),
    nearEvents: nearby.nearEvents,
    nearBusinesses: nearby.nearBusinesses,
    nearDrivers: nearby.nearDrivers,
    nearPeople: nearby.nearPeople,
    hotArea: detectHotArea(),
  };
}

/* ─── refreshContext ────────────────────────────────────── */

export function refreshContext(): ContextState {
  const fresh = getCurrentContext();
  saveContext(fresh);
  return fresh;
}

/* ─── getRecommendations ────────────────────────────────── */

export function getRecommendations(context: ContextState): ContextRecommendation[] {
  const envRecs = getEnvironmentRecommendations(context.environment);
  const period = getPeriodEmphasis(context.period);
  const movement = getMovementModifiers(context.movement);

  // Boost recommendations that match period emphasis
  const boosted = envRecs.map((rec) => {
    let priority = rec.priority;

    if (period.emphasize.some((k) => rec.route.includes(k))) {
      priority -= 1;
    }

    if (movement.boost.some((k) => rec.route.includes(k))) {
      priority -= 1;
    }

    if (movement.suppress.some((k) => rec.route.includes(k))) {
      priority += 2;
    }

    return { ...rec, priority };
  });

  // Sort by priority (lower = higher priority)
  return boosted.sort((a, b) => a.priority - b.priority);
}

/* ─── getPeriodSuggestion ───────────────────────────────── */

export function getPeriodSuggestion(context: ContextState): string {
  const period = getPeriodEmphasis(context.period);
  return Array.isArray(period.suggest) ? period.suggest[0] : period.suggest;
}
