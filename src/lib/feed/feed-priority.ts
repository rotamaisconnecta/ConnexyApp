/* ============================================================
   CONNEXY
   Phase 8.4
   Smart Feed — Priority Scoring
   Pure functions. No side effects. No React.
=========================================================== */

import type { ContextState } from "@/lib/context/context-types";
import { ContextMovement, ContextPeriod, ContextEnvironment } from "@/lib/context/context-types";
import type { SmartSectionTypeValue } from "./feed-types";

/* ─── Section Base Scores ────────────────────────────────── */

const BASE_SCORES: Record<SmartSectionTypeValue, number> = {
  HERO: 100,
  HOT_AREA: 85,
  RECOMMENDATIONS: 80,
  NEARBY_PEOPLE: 70,
  NEARBY_EVENTS: 65,
  NEARBY_BUSINESSES: 60,
  NEARBY_DRIVERS: 55,
  TRENDING: 50,
  FOOTER: 10,
};

/* ─── Movement Modifiers ─────────────────────────────────── */

const MOVEMENT_MODIFIERS: Record<string, Partial<Record<SmartSectionTypeValue, number>>> = {
  [ContextMovement.CALM]: {
    NEARBY_PEOPLE: 15,
    TRENDING: 10,
    NEARBY_DRIVERS: -10,
    NEARBY_EVENTS: -5,
  },
  [ContextMovement.NORMAL]: {
    NEARBY_PEOPLE: 5,
    NEARBY_EVENTS: 5,
    NEARBY_BUSINESSES: 5,
  },
  [ContextMovement.BUSY]: {
    NEARBY_DRIVERS: 20,
    NEARBY_BUSINESSES: 15,
    HOT_AREA: 10,
    NEARBY_PEOPLE: -10,
  },
  [ContextMovement.CROWDED]: {
    NEARBY_EVENTS: 20,
    HOT_AREA: 15,
    NEARBY_DRIVERS: 10,
    NEARBY_PEOPLE: -5,
  },
};

/* ─── Period Modifiers ───────────────────────────────────── */

const PERIOD_MODIFIERS: Record<string, Partial<Record<SmartSectionTypeValue, number>>> = {
  [ContextPeriod.MORNING]: {
    NEARBY_BUSINESSES: 10,
    RECOMMENDATIONS: 5,
    NEARBY_EVENTS: -5,
  },
  [ContextPeriod.AFTERNOON]: {
    NEARBY_BUSINESSES: 15,
    NEARBY_EVENTS: 10,
    HOT_AREA: 5,
  },
  [ContextPeriod.EVENING]: {
    NEARBY_EVENTS: 20,
    NEARBY_DRIVERS: 10,
    TRENDING: 10,
    NEARBY_BUSINESSES: -5,
  },
  [ContextPeriod.NIGHT]: {
    NEARBY_DRIVERS: 15,
    TRENDING: 10,
    NEARBY_BUSINESSES: -10,
    NEARBY_PEOPLE: -10,
  },
};

/* ─── Environment Modifiers ──────────────────────────────── */

const ENVIRONMENT_MODIFIERS: Record<string, Partial<Record<SmartSectionTypeValue, number>>> = {
  [ContextEnvironment.SHOPPING]: {
    NEARBY_BUSINESSES: 25,
    RECOMMENDATIONS: 15,
    NEARBY_EVENTS: 5,
  },
  [ContextEnvironment.EVENT]: {
    NEARBY_EVENTS: 30,
    NEARBY_PEOPLE: 15,
    HOT_AREA: 10,
    NEARBY_BUSINESSES: 5,
  },
  [ContextEnvironment.ROAD]: {
    NEARBY_DRIVERS: 30,
    NEARBY_BUSINESSES: 5,
    NEARBY_EVENTS: -10,
  },
  [ContextEnvironment.HOME]: {
    TRENDING: 15,
    NEARBY_PEOPLE: 10,
    RECOMMENDATIONS: 10,
    NEARBY_DRIVERS: -10,
  },
  [ContextEnvironment.CITY]: {
    NEARBY_EVENTS: 10,
    NEARBY_PEOPLE: 10,
    NEARBY_BUSINESSES: 10,
    HOT_AREA: 5,
  },
  [ContextEnvironment.BUSINESS]: {
    NEARBY_BUSINESSES: 20,
    RECOMMENDATIONS: 15,
    NEARBY_EVENTS: -5,
  },
  [ContextEnvironment.AIRPORT]: {
    NEARBY_DRIVERS: 25,
    NEARBY_BUSINESSES: 10,
    NEARBY_EVENTS: -15,
  },
  [ContextEnvironment.UNIVERSITY]: {
    NEARBY_PEOPLE: 20,
    NEARBY_EVENTS: 10,
    TRENDING: 10,
  },
  [ContextEnvironment.BEACH]: {
    NEARBY_PEOPLE: 15,
    NEARBY_BUSINESSES: 10,
    NEARBY_EVENTS: 5,
    TRENDING: 5,
  },
  [ContextEnvironment.PARK]: {
    NEARBY_PEOPLE: 15,
    NEARBY_EVENTS: 10,
    RECOMMENDATIONS: 5,
  },
};

/* ─── Nearby Boost ───────────────────────────────────────── */

function getNearbyBoost(context: ContextState, sectionType: SmartSectionTypeValue): number {
  switch (sectionType) {
    case "NEARBY_PEOPLE":
      return Math.min(context.nearPeople * 0.5, 20);
    case "NEARBY_EVENTS":
      return Math.min(context.nearEvents * 3, 15);
    case "NEARBY_BUSINESSES":
      return Math.min(context.nearBusinesses * 2, 15);
    case "NEARBY_DRIVERS":
      return Math.min(context.nearDrivers * 2, 15);
    case "HOT_AREA":
      return context.hotArea ? 15 : 0;
    default:
      return 0;
  }
}

/* ─── scoreSection ───────────────────────────────────────── */

export function scoreSection(sectionType: SmartSectionTypeValue, context: ContextState): number {
  let score = BASE_SCORES[sectionType] ?? 50;

  const movementMods = MOVEMENT_MODIFIERS[context.movement];
  if (movementMods?.[sectionType] !== undefined) {
    score += movementMods[sectionType]!;
  }

  const periodMods = PERIOD_MODIFIERS[context.period];
  if (periodMods?.[sectionType] !== undefined) {
    score += periodMods[sectionType]!;
  }

  const envMods = ENVIRONMENT_MODIFIERS[context.environment];
  if (envMods?.[sectionType] !== undefined) {
    score += envMods[sectionType]!;
  }

  score += getNearbyBoost(context, sectionType);

  return score;
}

/* ─── sortByScore ────────────────────────────────────────── */

export function sortByScore<T extends { type: SmartSectionTypeValue; priority: number }>(
  sections: T[],
  context: ContextState,
): T[] {
  return [...sections]
    .map((s) => ({
      ...s,
      priority: scoreSection(s.type, context),
    }))
    .sort((a, b) => b.priority - a.priority);
}
