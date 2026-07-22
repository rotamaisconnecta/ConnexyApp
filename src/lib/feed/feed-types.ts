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
