/* ==== integration-types.ts -- Type definitions for the Integration Hub
   Pure TypeScript. No React. No side effects. ==== */

import type { ActivityLevelValue } from "@/lib/engine/engine-types";

/* ==== Event flow states ==== */

export const PlaceStatus = {
  CALMO: "CALMO",
  MOVIMENTADO: "MOVIMENTADO",
  BOMBANDO: "BOMBANDO",
  MUITO_CHEIO: "MUITO_CHEIO",
  EVENTO_ACONTECENDO: "EVENTO_ACONTECENDO",
} as const;
export type PlaceStatusValue = (typeof PlaceStatus)[keyof typeof PlaceStatus];

export const PlaceStatusMeta: Record<
  PlaceStatusValue,
  { label: string; color: string; bg: string; border: string; emoji: string }
> = {
  CALMO: {
    label: "Calmo",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    emoji: "😌",
  },
  MOVIMENTADO: {
    label: "Movimentado",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    emoji: "👥",
  },
  BOMBANDO: {
    label: "Bombando",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    emoji: "🔥",
  },
  MUITO_CHEIO: {
    label: "Muito cheio",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    emoji: " packed",
  },
  EVENTO_ACONTECENDO: {
    label: "Evento acontecendo",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    emoji: "🎉",
  },
};

/* ==== Integration action types ==== */

export const IntegrationAction = {
  EVENT_CREATED: "EVENT_CREATED",
  CHECKIN_CREATED: "CHECKIN_CREATED",
  REEL_POSTED: "REEL_POSTED",
  DRIVER_ONLINE: "DRIVER_ONLINE",
  OFFER_CREATED: "OFFER_CREATED",
  MOMENT_POSTED: "MOMENT_POSTED",
  BUSINESS_UPDATED: "BUSINESS_UPDATED",
  RIDE_REQUESTED: "RIDE_REQUESTED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
} as const;
export type IntegrationActionValue = (typeof IntegrationAction)[keyof typeof IntegrationAction];

/* ==== Integration targets ==== */

export const IntegrationTarget = {
  FEED: "FEED",
  REELS: "REELS",
  MARKETPLACE: "MARKETPLACE",
  CHAT: "CHAT",
  RIDE: "RIDE",
  DRIVER: "DRIVER",
  DISCOVERY: "DISCOVERY",
  PROFILE: "PROFILE",
  NOTIFICATIONS: "NOTIFICATIONS",
  ENGINE: "ENGINE",
  EVENTS: "EVENTS",
  MAP: "MAP",
  MOMENTS: "MOMENTS",
  CHECKIN: "CHECKIN",
} as const;
export type IntegrationTargetValue = (typeof IntegrationTarget)[keyof typeof IntegrationTarget];

/* ==== Map marker types ==== */

export const MapMarkerType = {
  PERSON: "PERSON",
  DRIVER: "DRIVER",
  EVENT: "EVENT",
  BUSINESS: "BUSINESS",
  OFFER: "OFFER",
  REEL: "REEL",
  MOMENT: "MOMENT",
  PLACE: "PLACE",
} as const;
export type MapMarkerTypeValue = (typeof MapMarkerType)[keyof typeof MapMarkerType];

export const MapMarkerAction = {
  CLICK: "CLICK",
  PREVIEW: "PREVIEW",
  NAVIGATE: "NAVIGATE",
  SHARE: "SHARE",
  FAVORITE: "FAVORITE",
  SAVE: "SAVE",
} as const;
export type MapMarkerActionValue = (typeof MapMarkerAction)[keyof typeof MapMarkerAction];

/* ==== Check-in transitions ==== */

export const CheckinTransition = {
  INTERESTED: "INTERESTED",
  GOING: "GOING",
  CHECKED_IN: "CHECKED_IN",
  LEFT_EVENT: "LEFT_EVENT",
} as const;
export type CheckinTransitionValue = (typeof CheckinTransition)[keyof typeof CheckinTransition];

export const CheckinTransitionMeta: Record<
  CheckinTransitionValue,
  { label: string; emoji: string; triggersFeed: boolean }
> = {
  INTERESTED: { label: "Interessado", emoji: "💡", triggersFeed: true },
  GOING: { label: "Indo", emoji: "🚶", triggersFeed: true },
  CHECKED_IN: { label: "Presente", emoji: "✅", triggersFeed: true },
  LEFT_EVENT: { label: "Saiu do evento", emoji: "👋", triggersFeed: false },
};

/* ==== Live data indicators ==== */

export const HeatLevel = {
  COLD: "COLD",
  WARM: "WARM",
  HOT: "HOT",
  BURNING: "BURNING",
} as const;
export type HeatLevelValue = (typeof HeatLevel)[keyof typeof HeatLevel];

export const HeatMeta: Record<HeatLevelValue, { label: string; color: string; pulse: boolean }> = {
  COLD: { label: "Frio", color: "bg-blue-400", pulse: false },
  WARM: { label: "Morno", color: "bg-yellow-400", pulse: false },
  HOT: { label: "Quente", color: "bg-orange-500", pulse: true },
  BURNING: { label: "Explodindo", color: "bg-red-500", pulse: true },
};

export const TrendingDirection = {
  UP: "UP",
  DOWN: "DOWN",
  STABLE: "STABLE",
} as const;
export type TrendingDirectionValue = (typeof TrendingDirection)[keyof typeof TrendingDirection];

export const TrendingMeta: Record<
  TrendingDirectionValue,
  { label: string; color: string; icon: "trending-up" | "trending-down" | "minus" }
> = {
  UP: { label: "Subindo", color: "text-emerald-500", icon: "trending-up" },
  DOWN: { label: "Caindo", color: "text-red-500", icon: "trending-down" },
  STABLE: { label: "Estável", color: "text-muted-foreground", icon: "minus" },
};

/* ==== Core interfaces ==== */

export interface MapMarker {
  id: string;
  type: MapMarkerTypeValue;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  distanceMeters: number;
  heatLevel: HeatLevelValue;
  trending: TrendingDirectionValue;
  placeStatus?: PlaceStatusValue;
  actionUrl: string;
  metadata: MapMarkerMetadata;
}

export type MapMarkerMetadata =
  | PersonMarkerMetadata
  | DriverMarkerMetadata
  | EventMarkerMetadata
  | BusinessMarkerMetadata
  | OfferMarkerMetadata
  | ReelMarkerMetadata
  | MomentMarkerMetadata
  | PlaceMarkerMetadata;

interface PersonMarkerMetadata {
  kind: "person";
  online: boolean;
  lastSeen?: string;
  interests: string[];
  compatibility?: number;
}

interface DriverMarkerMetadata {
  kind: "driver";
  online: boolean;
  rating: number;
  vehicle: string;
  etaMinutes?: number;
  isAvailable: boolean;
}

interface EventMarkerMetadata {
  kind: "event";
  startDate: string;
  endDate: string;
  attendeeCount: number;
  category: string;
  isInterested: boolean;
  isAttending: boolean;
  checkedIn: boolean;
}

interface BusinessMarkerMetadata {
  kind: "business";
  category: string;
  rating: number;
  isOpen: boolean;
  promotionCount: number;
  couponCount: number;
  isFollowing: boolean;
}

interface OfferMarkerMetadata {
  kind: "offer";
  businessName: string;
  discountPercent: number;
  validUntil: string;
  isClaimed: boolean;
}

interface ReelMarkerMetadata {
  kind: "reel";
  viewCount: number;
  likeCount: number;
  authorName: string;
  authorPhoto: string;
  category: string;
}

interface MomentMarkerMetadata {
  kind: "moment";
  authorName: string;
  authorPhoto: string;
  text: string;
  expiresAt: string;
  remainingMs: number;
}

interface PlaceMarkerMetadata {
  kind: "place";
  status: PlaceStatusValue;
  category: string;
  rating?: number;
  checkinCount: number;
  isFavorite: boolean;
}

/* ==== Integration event ==== */

export interface IntegrationEvent {
  id: string;
  action: IntegrationActionValue;
  sourceTarget: IntegrationTargetValue;
  targets: IntegrationTargetValue[];
  timestamp: string;
  payload: IntegrationPayload;
  processed: boolean;
}

export type IntegrationPayload =
  | EventPayload
  | CheckinPayload
  | ReelPayload
  | DriverPayload
  | OfferPayload
  | MomentPayload
  | BusinessPayload
  | RidePayload
  | ProfilePayload;

interface EventPayload {
  kind: "event";
  eventId: string;
  eventName: string;
  category: string;
  venue: string;
  startDate: string;
  endDate: string;
  organizerId: string;
}

interface CheckinPayload {
  kind: "checkin";
  userId: string;
  userName: string;
  eventId: string;
  eventName: string;
  transition: CheckinTransitionValue;
  placeId?: string;
  placeName?: string;
  placeLat?: number;
  placeLng?: number;
}

interface ReelPayload {
  kind: "reel";
  reelId: string;
  authorId: string;
  authorName: string;
  category: string;
  locationId?: string;
  locationName?: string;
  eventId?: string;
  eventName?: string;
}

interface DriverPayload {
  kind: "driver";
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  serviceArea: string;
  vehicle: string;
}

interface OfferPayload {
  kind: "offer";
  offerId: string;
  businessId: string;
  businessName: string;
  title: string;
  discountPercent: number;
  lat: number;
  lng: number;
}

interface MomentPayload {
  kind: "moment";
  userId: string;
  userName: string;
  text: string;
  placeId?: string;
  placeName?: string;
  expiresAt: string;
}

interface BusinessPayload {
  kind: "business";
  businessId: string;
  businessName: string;
  category: string;
  lat: number;
  lng: number;
}

interface RidePayload {
  kind: "ride";
  rideId: string;
  passengerId: string;
  driverId?: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

interface ProfilePayload {
  kind: "profile";
  userId: string;
  field: string;
  value: string;
}

/* ==== Profile statistics ==== */

export interface ProfileStats {
  visitedPlaces: number;
  eventsAttended: number;
  placesCheckedIn: number;
  reelsPosted: number;
  momentsPosted: number;
  milesTraveled: number;
  connectionsMade: number;
}

export interface ProfileActivity {
  id: string;
  type:
    | "place_visit"
    | "event_attendance"
    | "checkin"
    | "reel_post"
    | "moment_post"
    | "connection"
    | "mile";
  title: string;
  subtitle: string;
  date: string;
  icon: string;
}

/* ==== Chat integration data ==== */

export interface ChatSuggestion {
  id: string;
  conversationId: string;
  text: string;
  context: string;
  confidence: number;
}

/* ==== Notification generation data ==== */

export interface GeneratedNotification {
  id: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  body: string;
  actorName?: string;
  actorAvatar?: string;
  imageUrl?: string;
  metadata: Record<string, string | number | boolean>;
}

/* ==== Feed integration item ==== */

export interface IntegrationFeedItem {
  id: string;
  source: IntegrationTargetValue;
  type: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  timestamp: string;
  priority: number;
  actionUrl: string;
}

/* ==== Engine input for integration ==== */

export interface EngineIntegrationInput {
  events: EngineEventInput[];
  drivers: EngineDriverInput[];
  moments: EngineMomentInput[];
  reels: EngineReelInput[];
  offers: EngineOfferInput[];
  businesses: EngineBusinessInput[];
  rides: EngineRideInput[];
  profiles: EngineProfileInput[];
  activities: EngineActivityInput[];
  locations: EngineLocationInput[];
  time: EngineTimeInput;
  interests: string[];
  compatibility: EngineCompatibilityInput[];
}

export interface EngineEventInput {
  id: string;
  name: string;
  category: string;
  venue: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  attendeeCount: number;
  isInterested: boolean;
  isAttending: boolean;
}

export interface EngineDriverInput {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  isAvailable: boolean;
  etaMinutes?: number;
}

interface EngineMomentInput {
  id: string;
  userId: string;
  userName: string;
  text: string;
  placeId?: string;
  expiresAt: string;
}

export interface EngineReelInput {
  id: string;
  authorId: string;
  category: string;
  viewCount: number;
  likeCount: number;
  locationId?: string;
}

export interface EngineOfferInput {
  id: string;
  businessId: string;
  title: string;
  discountPercent: number;
  lat: number;
  lng: number;
  validUntil: string;
}

export interface EngineBusinessInput {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  isOpen: boolean;
}

interface EngineRideInput {
  id: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  status: string;
  driverId?: string;
}

interface EngineProfileInput {
  userId: string;
  name: string;
  interests: string[];
  lat: number;
  lng: number;
  online: boolean;
}

interface EngineActivityInput {
  userId: string;
  type: string;
  timestamp: string;
  locationId?: string;
  lat?: number;
  lng?: number;
}

interface EngineLocationInput {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  checkinCount: number;
  heatLevel: HeatLevelValue;
}

interface EngineTimeInput {
  period: string;
  day: string;
  hour: number;
  isWeekend: boolean;
}

export interface EngineCompatibilityInput {
  userId: string;
  score: number;
  tier: string;
}

/* ==== Profile data interfaces (shared across modules) ==== */

export interface ProfileCheckinData {
  userId: string;
  eventId?: string;
  eventName?: string;
  placeId: string;
  placeName: string;
  placeLat: number;
  placeLng: number;
  transition: CheckinTransitionValue;
  timestamp: string;
}

export interface ProfileEventData {
  userId: string;
  eventId: string;
  eventName: string;
  category: string;
  venue: string;
  startDate: string;
  transition: CheckinTransitionValue;
}

export interface ProfileReelData {
  userId: string;
  reelId: string;
  category: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export interface ProfileMomentData {
  userId: string;
  momentId: string;
  text: string;
  placeName?: string;
  createdAt: string;
}

export interface ProfileConnectionData {
  userId: string;
  connectedUserId: string;
  connectedUserName: string;
  connectedAt: string;
}

export interface ProfileMileData {
  userId: string;
  distanceMeters: number;
  date: string;
  fromPlace?: string;
  toPlace?: string;
}

/* ==== Marketplace data interfaces (shared across modules) ==== */

export interface MarketplaceBusinessData {
  businessId: string;
  businessName: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  isOpen: boolean;
  promotionCount: number;
  couponCount: number;
  isFollowing: boolean;
}

export interface MarketplaceOfferData {
  offerId: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  lat: number;
  lng: number;
  isClaimed: boolean;
}

/* ==== Reel integration data (shared across modules) ==== */

export interface ReelIntegrationData {
  reelId: string;
  authorId: string;
  authorName: string;
  category: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  locationId?: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  eventId?: string;
  eventName?: string;
  hashtags: string[];
  createdAt: string;
}

/* ==== Driver integration data (shared across modules) ==== */

export interface DriverIntegrationData {
  driverId: string;
  driverName: string;
  driverPhoto: string;
  lat: number;
  lng: number;
  rating: number;
  vehicle: string;
  plate: string;
  serviceArea: string;
  isOnline: boolean;
  isAvailable: boolean;
  etaMinutes?: number;
}

/* ==== Event checkin counts (shared across modules) ==== */

export interface EventCheckinCounts {
  eventId: string;
  interested: number;
  going: number;
  checkedIn: number;
  left: number;
  total: number;
}
