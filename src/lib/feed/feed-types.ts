/* =========================================================
   feed-types.ts — Feed module types
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── Enums ──────────────────────────────────────────────── */

export const FeedItemType = {
  POST: "POST",
  MOMENT: "MOMENT",
  PLACE: "PLACE",
  EVENT: "EVENT",
  OFFER: "OFFER",
  ROUTE: "ROUTE",
  NETWORKING: "NETWORKING",
} as const;

export type FeedItemTypeValue = (typeof FeedItemType)[keyof typeof FeedItemType];

/* ─── Author ─────────────────────────────────────────────── */

export interface FeedAuthor {
  id: string;
  name: string;
  photo: string;
  handle: string;
  online?: boolean;
}

/* ─── Location ───────────────────────────────────────────── */

export interface FeedLocation {
  name: string;
  distance?: number;
}

/* ─── Visibility ─────────────────────────────────────────── */

export type FeedVisibility = "public" | "connections" | "friends" | "private";

/* ─── Feed Item ──────────────────────────────────────────── */

export interface FeedItem {
  id: string;
  type: FeedItemTypeValue;
  author: FeedAuthor;
  createdAt: Date;
  distance: number;
  interests: string[];
  location: FeedLocation | null;
  visibility: FeedVisibility;
  priority: number;
  data: FeedItemData;
}

/* ─── Item Data (union) ──────────────────────────────────── */

export type FeedItemData =
  PostData | MomentData | PlaceData | EventData | OfferData | RouteData | NetworkingData;

export interface PostData {
  kind: "POST";
  text: string;
  photos: string[];
  likes: number;
  comments: number;
  shares: number;
}

export interface MomentData {
  kind: "MOMENT";
  text: string;
  emoji: string;
  placeName: string | null;
  expiresAt: Date;
  active: boolean;
}

export interface PlaceData {
  kind: "PLACE";
  name: string;
  category: string;
  cover: string;
  rating: number;
}

export interface EventData {
  kind: "EVENT";
  name: string;
  banner: string;
  date: string;
  time: string;
  participants: number;
}

export interface OfferData {
  kind: "OFFER";
  title: string;
  image: string;
  discount: string;
  company: string;
  validUntil: string;
}

export interface RouteData {
  kind: "ROUTE";
  origin: string;
  destination: string;
  driver: FeedAuthor;
  departureTime: string;
  seatsAvailable: number;
}

export interface NetworkingData {
  kind: "NETWORKING";
  person: FeedAuthor;
  compatibility: number;
  sharedInterests: string[];
}

/* ─── Filter ─────────────────────────────────────────────── */

export type FeedFilterValue = "ALL" | FeedItemTypeValue;

export const FEED_FILTER_OPTIONS: { value: FeedFilterValue; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "POST", label: "Pessoas" },
  { value: "MOMENT", label: "Momentos" },
  { value: "EVENT", label: "Eventos" },
  { value: "PLACE", label: "Locais" },
  { value: "OFFER", label: "Promoções" },
  { value: "NETWORKING", label: "Networking" },
  { value: "ROUTE", label: "Rotas" },
];

/* ─── Sort ───────────────────────────────────────────────── */

export type FeedSortMode = "smart" | "recent" | "distance" | "popular";

export const FEED_SORT_OPTIONS: { value: FeedSortMode; label: string }[] = [
  { value: "smart", label: "Inteligente" },
  { value: "recent", label: "Recente" },
  { value: "distance", label: "Perto" },
  { value: "popular", label: "Popular" },
];

/* ===========================================================
   Smart Feed — Section Types
   Phase 8.4
=========================================================== */

export const SmartSectionType = {
  HERO: "HERO",
  HOT_AREA: "HOT_AREA",
  RECOMMENDATIONS: "RECOMMENDATIONS",
  NEARBY_PEOPLE: "NEARBY_PEOPLE",
  NEARBY_PLACES: "NEARBY_PLACES",
  NEARBY_EVENTS: "NEARBY_EVENTS",
  NEARBY_EVENTS_TODAY: "NEARBY_EVENTS_TODAY",
  NEARBY_EVENTS_UPCOMING: "NEARBY_EVENTS_UPCOMING",
  NEARBY_BUSINESSES: "NEARBY_BUSINESSES",
  NEARBY_DRIVERS: "NEARBY_DRIVERS",
  TRENDING: "TRENDING",
  FOOTER: "FOOTER",
} as const;

export type SmartSectionTypeValue = (typeof SmartSectionType)[keyof typeof SmartSectionType];

/* ─── Smart Section ──────────────────────────────────────── */

export interface SmartSection {
  id: string;
  type: SmartSectionTypeValue;
  title: string;
  subtitle: string;
  emoji: string;
  priority: number;
  data: SmartSectionData;
}

/* ─── Section Data Union ─────────────────────────────────── */

export type SmartSectionData =
  | HeroSectionData
  | HotAreaSectionData
  | RecommendationsSectionData
  | NearbyPeopleSectionData
  | NearbyPlacesSectionData
  | NearbyEventsSectionData
  | NearbyBusinessesSectionData
  | NearbyDriversSectionData
  | TrendingSectionData
  | FooterSectionData;

export interface HeroSectionData {
  kind: "HERO";
  message: string;
  emoji: string;
  subtitle: string;
}

export interface HotAreaSectionData {
  kind: "HOT_AREA";
  level: "CALMO" | "NORMAL" | "MOVIMENTADO" | "BOMBANDO";
  label: string;
  emoji: string;
  description: string;
}

export interface RecommendationsSectionData {
  kind: "RECOMMENDATIONS";
  items: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
  }>;
}

export interface NearbyPeopleSectionData {
  kind: "NEARBY_PEOPLE";
  count: number;
  people: Array<{
    id: string;
    name: string;
    photo: string;
    age?: number;
    compatibility?: number;
    distance: string;
    distanceMeters: number;
    interests: string[];
    online: boolean;
    commonalities?: { labels: string[]; total: number };
  }>;
}

export interface NearbyPlacesSectionData {
  kind: "NEARBY_PLACES";
  count: number;
  places: Array<{
    id: string;
    name: string;
    photo: string;
    category: string;
    rating: number;
    distance: string;
    open: boolean;
    hours?: string;
  }>;
}

export interface NearbyEventsSectionData {
  kind: "NEARBY_EVENTS";
  count: number;
  events: Array<{
    id: string;
    name: string;
    banner: string;
    date: string;
    time: string;
    participants: number;
    distance: string;
    location: string;
  }>;
}

export interface NearbyBusinessesSectionData {
  kind: "NEARBY_BUSINESSES";
  count: number;
  businesses: Array<{
    id: string;
    name: string;
    cover: string;
    category: string;
    rating: number;
    distance: string;
    offer?: string;
  }>;
}

export interface NearbyDriversSectionData {
  kind: "NEARBY_DRIVERS";
  count: number;
  drivers: Array<{
    id: string;
    name: string;
    photo: string;
    car: string;
    rating: number;
    distance: string;
    available: boolean;
  }>;
}

export interface TrendingSectionData {
  kind: "TRENDING";
  items: Array<{
    id: string;
    title: string;
    emoji: string;
    count: number;
    trend: "up" | "stable" | "new";
  }>;
}

export interface FooterSectionData {
  kind: "FOOTER";
  message: string;
}
