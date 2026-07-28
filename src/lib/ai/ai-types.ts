/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Types
   Pure TypeScript. No React. No side effects.
============================================================ */

/* ─── AIEntityType ──────────────────────────────────────── */

export const AIEntityType = {
  PERSON: "PERSON",
  EVENT: "EVENT",
  BUSINESS: "BUSINESS",
  PLACE: "PLACE",
  OFFER: "OFFER",
  DRIVER: "DRIVER",
  FEED: "FEED",
} as const;

export type AIEntityTypeValue = (typeof AIEntityType)[keyof typeof AIEntityType];

/* ─── AIEntity ──────────────────────────────────────────── */

export interface AIEntity {
  id: string;
  type: AIEntityTypeValue;
  distance: number;
  rating: number;
  activity: number;
  popularity: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  interests: string[];
  score: number;
  priority: number;
}

/* ─── AIScore ───────────────────────────────────────────── */

export interface AIScore {
  distanceScore: number;
  contextScore: number;
  interestScore: number;
  historyScore: number;
  popularityScore: number;
  timeScore: number;
  activityScore: number;
  finalScore: number;
}

/* ─── AIWeight ──────────────────────────────────────────── */

export const AI_WEIGHTS = {
  distance: 0.2,
  context: 0.2,
  interest: 0.2,
  history: 0.15,
  popularity: 0.1,
  time: 0.1,
  activity: 0.05,
} as const;

/* ─── AIHistoryAction ───────────────────────────────────── */

export const AIHistoryAction = {
  VIEW: "VIEW",
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  SHARE: "SHARE",
  PUBLISH: "PUBLISH",
  CLICK: "CLICK",
  OPEN_PROFILE: "OPEN_PROFILE",
  OPEN_EVENT: "OPEN_EVENT",
  OPEN_OFFER: "OPEN_OFFER",
} as const;

export type AIHistoryActionValue = (typeof AIHistoryAction)[keyof typeof AIHistoryAction];

/* ─── AIHistoryEntry ────────────────────────────────────── */

export interface AIHistoryEntry {
  entityId: string;
  entityType: AIEntityTypeValue;
  action: AIHistoryActionValue;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/* ─── AIContextSignal ───────────────────────────────────── */

export interface AIContextSignal {
  period: string;
  environment: string;
  movement: string;
  weather: string;
  nearEvents: number;
  nearBusinesses: number;
  nearDrivers: number;
  nearPeople: number;
  hotArea: boolean;
  role: string;
}

/* ─── AIProfile ─────────────────────────────────────────── */

export interface AIProfile {
  id: string;
  interests: string[];
  tags: string[];
  location: { lat: number; lng: number };
}

/* ─── AIRankedResult ────────────────────────────────────── */

export interface AIRankedResult<T> {
  items: T[];
  scores: Map<string, AIScore>;
  generatedAt: number;
}

/* ─── AIEngineConfig ────────────────────────────────────── */

export interface AIEngineConfig {
  maxDistance: number;
  defaultLimit: number;
  cacheTtlMs: number;
  historyMaxEntries: number;
}
