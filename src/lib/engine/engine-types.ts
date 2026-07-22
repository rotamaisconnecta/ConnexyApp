/* ─── RecommendationType ─────────────────────────────────── */

export const RecommendationType = {
  PERSON: "PERSON",
  EVENT: "EVENT",
  BUSINESS: "BUSINESS",
  PLACE: "PLACE",
  OFFER: "OFFER",
  REEL: "REEL",
  DRIVER: "DRIVER",
  ROUTE: "ROUTE",
  NETWORKING: "NETWORKING",
} as const;

export type RecommendationTypeValue = (typeof RecommendationType)[keyof typeof RecommendationType];

/* ─── ActivityLevel ──────────────────────────────────────── */

export const ActivityLevel = {
  CALMO: "CALMO",
  MODERADO: "MODERADO",
  EM_ALTA: "EM_ALTA",
  BOMBANDO: "BOMBANDO",
  MUITO_CHEIO: "MUITO_CHEIO",
} as const;

export type ActivityLevelValue = (typeof ActivityLevel)[keyof typeof ActivityLevel];

/* ─── RecommendationReason ───────────────────────────────── */

export const RecommendationReason = {
  DISTANCIA: "DISTANCIA",
  INTERESSE: "INTERESSE",
  COMPATIBILIDADE: "COMPATIBILIDADE",
  POPULARIDADE: "POPULARIDADE",
  EVENTO: "EVENTO",
  LOCAL: "LOCAL",
  HORARIO: "HORARIO",
  TENDENCIA: "TENDENCIA",
} as const;

export type RecommendationReasonValue =
  (typeof RecommendationReason)[keyof typeof RecommendationReason];

/* ─── ContextPeriod ──────────────────────────────────────── */

export const ContextPeriod = {
  MANHA: "MANHA",
  TARDE: "TARDE",
  NOITE: "NOITE",
  MADRUGADA: "MADRUGADA",
} as const;

export type ContextPeriodValue = (typeof ContextPeriod)[keyof typeof ContextPeriod];

/* ─── ContextDay ─────────────────────────────────────────── */

export const ContextDay = {
  DIA_UTIL: "DIA_UTIL",
  FIM_DE_SEMANA: "FIM_DE_SEMANA",
} as const;

export type ContextDayValue = (typeof ContextDay)[keyof typeof ContextDay];

/* ─── ContextLocation ────────────────────────────────────── */

export const ContextLocation = {
  CASA: "CASA",
  TRABALHO: "TRABALHO",
  EVENTO: "EVENTO",
  CENTRO: "CENTRO",
  SHOPPING: "SHOPPING",
  UNIVERSIDADE: "UNIVERSIDADE",
} as const;

export type ContextLocationValue = (typeof ContextLocation)[keyof typeof ContextLocation];

/* ─── EngineUser ─────────────────────────────────────────── */

export interface EngineUser {
  id: string;
  name: string;
  handle: string;
  photoUrl: string;
  interests: string[];
  favoritePlaceIds: string[];
  vibeTags: string[];
  location: {
    lat: number;
    lng: number;
    label: string;
  };
  context: EngineContext;
}

/* ─── EngineContext ──────────────────────────────────────── */

export interface EngineContext {
  period: ContextPeriodValue;
  day: ContextDayValue;
  location: ContextLocationValue;
  lat: number;
  lng: number;
  timestamp: string;
}

/* ─── RecommendationScore ────────────────────────────────── */

export interface RecommendationScore {
  interest: number;
  distance: number;
  popularity: number;
  compatibility: number;
  time: number;
  recency: number;
  total: number;
}

/* ─── Recommendation ─────────────────────────────────────── */

export interface Recommendation {
  id: string;
  type: RecommendationTypeValue;
  score: RecommendationScore;
  reasons: RecommendationReasonValue[];
  title: string;
  subtitle: string;
  imageUrl: string;
  distanceMeters: number;
  activityLevel: ActivityLevelValue;
  trending: boolean;
  metadata: RecommendationMetadata;
}

/* ─── RecommendationMetadata ─────────────────────────────── */

export type RecommendationMetadata =
  | PersonMetadata
  | EventMetadata
  | BusinessMetadata
  | PlaceMetadata
  | OfferMetadata
  | ReelMetadata
  | DriverMetadata
  | RouteMetadata
  | NetworkingMetadata;

export interface PersonMetadata {
  kind: "person";
  age: number;
  profession: string | null;
  compatibilityPercent: number;
  mutualConnections: number;
  isOnline: boolean;
  lastSeen: string | null;
}

export interface EventMetadata {
  kind: "event";
  date: string;
  location: string;
  interestedCount: number;
  attendingCount: number;
  isInterested: boolean;
  isAttending: boolean;
  category: string;
}

export interface BusinessMetadata {
  kind: "business";
  category: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  isFollowing: boolean;
  offerCount: number;
}

export interface PlaceMetadata {
  kind: "place";
  category: string;
  rating: number;
  checkInCount: number;
  isOpen: boolean;
  priceRange: string | null;
}

export interface OfferMetadata {
  kind: "offer";
  businessName: string;
  businessLogo: string;
  discountPercent: number;
  validUntil: string;
  originalPrice: number;
  finalPrice: number;
}

export interface ReelMetadata {
  kind: "reel";
  authorName: string;
  authorPhoto: string;
  likes: number;
  comments: number;
  duration: number;
  category: string;
}

export interface DriverMetadata {
  kind: "driver";
  rating: number;
  vehicle: string;
  plate: string;
  etaMinutes: number;
  isAvailable: boolean;
  totalTrips: number;
}

export interface RouteMetadata {
  kind: "route";
  origin: string;
  destination: string;
  distanceMeters: number;
  durationMinutes: number;
  priceEstimate: number;
}

export interface NetworkingMetadata {
  kind: "networking";
  eventName: string;
  eventDate: string;
  mutualInterests: string[];
  matchPercent: number;
}

/* ─── TrendingPlace ──────────────────────────────────────── */

export interface TrendingPlace {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  activityLevel: ActivityLevelValue;
  checkInCount: number;
  trending: boolean;
}

/* ─── TrendingEvent ──────────────────────────────────────── */

export interface TrendingEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  coverUrl: string;
  category: string;
  interestedCount: number;
  attendingCount: number;
  activityLevel: ActivityLevelValue;
  trending: boolean;
}

/* ─── TrendingBusiness ───────────────────────────────────── */

export interface TrendingBusiness {
  id: string;
  name: string;
  category: string;
  logo: string;
  rating: number;
  reviewCount: number;
  distanceMeters: number;
  activityLevel: ActivityLevelValue;
  offerCount: number;
  trending: boolean;
}

/* ─── TrendingPerson ─────────────────────────────────────── */

export interface TrendingPerson {
  id: string;
  name: string;
  handle: string;
  photoUrl: string;
  profession: string | null;
  age: number;
  compatibilityPercent: number;
  distanceMeters: number;
  isOnline: boolean;
  mutualConnections: number;
}

/* ─── TrendingDriver ─────────────────────────────────────── */

export interface TrendingDriver {
  id: string;
  name: string;
  photo: string;
  rating: number;
  vehicle: string;
  etaMinutes: number;
  distanceMeters: number;
  isAvailable: boolean;
  totalTrips: number;
}

/* ─── EngineNotification ─────────────────────────────────── */

export interface EngineNotification {
  id: string;
  type: RecommendationTypeValue;
  title: string;
  body: string;
  icon: string;
  reason: RecommendationReasonValue;
  score: number;
  actionUrl: string;
  createdAt: string;
  read: boolean;
}

/* ─── Scoring Weights ────────────────────────────────────── */

export const SCORING_WEIGHTS = {
  interest: 0.3,
  distance: 0.25,
  popularity: 0.15,
  compatibility: 0.15,
  time: 0.1,
  recency: 0.05,
} as const;

/* ─── TrendingMeta ───────────────────────────────────────── */

export interface TrendingMeta {
  level: ActivityLevelValue;
  label: string;
  emoji: string;
  color: string;
}

export const ACTIVITY_META: TrendingMeta[] = [
  {
    level: ActivityLevel.CALMO,
    label: "Calmo",
    emoji: "😴",
    color: "bg-blue-500/15 text-blue-400",
  },
  {
    level: ActivityLevel.MODERADO,
    label: "Moderado",
    emoji: "😌",
    color: "bg-green-500/15 text-green-400",
  },
  {
    level: ActivityLevel.EM_ALTA,
    label: "Em alta",
    emoji: "🔥",
    color: "bg-amber-500/15 text-amber-400",
  },
  {
    level: ActivityLevel.BOMBANDO,
    label: "Bombando",
    emoji: "💥",
    color: "bg-orange-500/15 text-orange-400",
  },
  {
    level: ActivityLevel.MUITO_CHEIO,
    label: "Muito cheio",
    emoji: "拥挤",
    color: "bg-red-500/15 text-red-400",
  },
];
