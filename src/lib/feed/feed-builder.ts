/* ============================================================
   CONNEXY
   Phase 8.4
   Smart Feed — Builder
   Assembles feed sections based on context + role.
   Pure functions. No side effects. No React.
=========================================================== */

import type { ContextState } from "@/lib/context/context-types";
import { ContextEnvironment } from "@/lib/context/context-types";
import type { UserRole } from "@/lib/roles/roles-types";
import type { SmartSection, SmartSectionTypeValue } from "./feed-types";
import { scoreSection } from "./feed-priority";
import {
  createHeroSection,
  createHotAreaSection,
  createRecommendationsSection,
  createNearbyPeopleSection,
  createNearbyEventsSection,
  createNearbyBusinessesSection,
  createNearbyDriversSection,
  createTrendingSection,
  createFooterSection,
} from "./feed-sections";

/* ─── Section Templates per Environment ──────────────────── */

const ENVIRONMENT_TEMPLATES: Record<string, SmartSectionTypeValue[]> = {
  [ContextEnvironment.CITY]: [
    "HERO",
    "HOT_AREA",
    "NEARBY_PEOPLE",
    "NEARBY_EVENTS",
    "NEARBY_BUSINESSES",
    "TRENDING",
    "FOOTER",
  ],
  [ContextEnvironment.SHOPPING]: [
    "HERO",
    "NEARBY_BUSINESSES",
    "RECOMMENDATIONS",
    "NEARBY_EVENTS",
    "NEARBY_PEOPLE",
    "TRENDING",
    "FOOTER",
  ],
  [ContextEnvironment.EVENT]: [
    "HERO",
    "HOT_AREA",
    "NEARBY_EVENTS",
    "NEARBY_PEOPLE",
    "NEARBY_BUSINESSES",
    "TRENDING",
    "FOOTER",
  ],
  [ContextEnvironment.ROAD]: [
    "HERO",
    "NEARBY_DRIVERS",
    "NEARBY_BUSINESSES",
    "NEARBY_EVENTS",
    "RECOMMENDATIONS",
    "FOOTER",
  ],
  [ContextEnvironment.HOME]: [
    "HERO",
    "TRENDING",
    "NEARBY_PEOPLE",
    "NEARBY_EVENTS",
    "RECOMMENDATIONS",
    "FOOTER",
  ],
  [ContextEnvironment.BUSINESS]: [
    "HERO",
    "NEARBY_BUSINESSES",
    "RECOMMENDATIONS",
    "NEARBY_EVENTS",
    "NEARBY_PEOPLE",
    "TRENDING",
    "FOOTER",
  ],
  [ContextEnvironment.AIRPORT]: [
    "HERO",
    "NEARBY_DRIVERS",
    "NEARBY_BUSINESSES",
    "RECOMMENDATIONS",
    "FOOTER",
  ],
  [ContextEnvironment.UNIVERSITY]: [
    "HERO",
    "NEARBY_PEOPLE",
    "NEARBY_EVENTS",
    "TRENDING",
    "RECOMMENDATIONS",
    "FOOTER",
  ],
  [ContextEnvironment.BEACH]: [
    "HERO",
    "NEARBY_PEOPLE",
    "NEARBY_BUSINESSES",
    "NEARBY_EVENTS",
    "TRENDING",
    "FOOTER",
  ],
  [ContextEnvironment.PARK]: [
    "HERO",
    "NEARBY_PEOPLE",
    "NEARBY_EVENTS",
    "RECOMMENDATIONS",
    "TRENDING",
    "FOOTER",
  ],
};

/* ─── Role Overrides ─────────────────────────────────────── */

const ROLE_OVERRIDES: Partial<
  Record<UserRole, { add?: SmartSectionTypeValue[]; remove?: SmartSectionTypeValue[] }>
> = {
  DRIVER: {
    add: ["NEARBY_DRIVERS"],
    remove: [],
  },
  BUSINESS: {
    add: ["NEARBY_BUSINESSES", "RECOMMENDATIONS"],
    remove: [],
  },
  EVENT_CREATOR: {
    add: ["NEARBY_EVENTS"],
    remove: [],
  },
};

/* ─── Section Creators Map ───────────────────────────────── */

const SECTION_CREATORS: Record<SmartSectionTypeValue, (context: ContextState) => SmartSection> = {
  HERO: createHeroSection,
  HOT_AREA: createHotAreaSection,
  RECOMMENDATIONS: createRecommendationsSection,
  NEARBY_PEOPLE: createNearbyPeopleSection,
  NEARBY_EVENTS: createNearbyEventsSection,
  NEARBY_BUSINESSES: createNearbyBusinessesSection,
  NEARBY_DRIVERS: createNearbyDriversSection,
  TRENDING: createTrendingSection,
  FOOTER: createFooterSection,
};

/* ─── buildFeed ──────────────────────────────────────────── */

export function buildFeed(context: ContextState): SmartSection[] {
  const template = [
    ...(ENVIRONMENT_TEMPLATES[context.environment] ??
      ENVIRONMENT_TEMPLATES[ContextEnvironment.CITY]),
  ];

  const roleOverride = ROLE_OVERRIDES[context.currentRole];
  if (roleOverride) {
    if (roleOverride.add) {
      for (const s of roleOverride.add) {
        if (!template.includes(s)) {
          template.splice(template.length - 1, 0, s);
        }
      }
    }
    if (roleOverride.remove) {
      for (const s of roleOverride.remove) {
        const idx = template.indexOf(s);
        if (idx !== -1) template.splice(idx, 1);
      }
    }
  }

  const sections: SmartSection[] = template
    .filter((type) => type !== "HOT_AREA" || context.hotArea || context.movement !== "CALM")
    .map((type) => SECTION_CREATORS[type](context));

  const scored = sections.map((s) => ({
    ...s,
    priority: scoreSection(s.type, context),
  }));

  const heroSection = scored.find((s) => s.type === "HERO");
  const footerSection = scored.find((s) => s.type === "FOOTER");
  const middle = scored
    .filter((s) => s.type !== "HERO" && s.type !== "FOOTER")
    .sort((a, b) => b.priority - a.priority);

  return [heroSection!, ...middle, footerSection!].filter(Boolean);
}
