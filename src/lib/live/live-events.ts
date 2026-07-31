/* ============================================================
   CONNEXY
   Phase 8.5
   Live Ecosystem — Event Types
   Pure TypeScript. No React. No side effects.
=========================================================== */

/* ─── Event Type Enum ────────────────────────────────────── */

import type { PresenceVisibilityValue } from "@/lib/event-checkin/checkin-types";

export const LiveEventType = {
  PHOTO_CREATED: "PHOTO_CREATED",
  VIDEO_CREATED: "VIDEO_CREATED",
  TEXT_CREATED: "TEXT_CREATED",
  MOMENT_CREATED: "MOMENT_CREATED",
  REEL_CREATED: "REEL_CREATED",
  EVENT_CREATED: "EVENT_CREATED",
  PLACE_CREATED: "PLACE_CREATED",
  OFFER_CREATED: "OFFER_CREATED",
  RIDE_CREATED: "RIDE_CREATED",
  CHECKIN_CREATED: "CHECKIN_CREATED",
  DRIVER_ONLINE: "DRIVER_ONLINE",
  DRIVER_OFFLINE: "DRIVER_OFFLINE",
  BUSINESS_ONLINE: "BUSINESS_ONLINE",
  USER_ENTER_AREA: "USER_ENTER_AREA",
  USER_EXIT_AREA: "USER_EXIT_AREA",
} as const;

export type LiveEventTypeValue = (typeof LiveEventType)[keyof typeof LiveEventType];

/* ─── Base Event ─────────────────────────────────────────── */

export interface LiveEventBase {
  id: string;
  type: LiveEventTypeValue;
  timestamp: number;
  source: string;
}

/* ─── Payload Types ──────────────────────────────────────── */

export interface PhotoCreatedPayload {
  userId: string;
  userName: string;
  userPhoto: string;
  photoUrl: string;
  caption: string;
  locationName: string | null;
  interests: string[];
}

export interface VideoCreatedPayload {
  userId: string;
  userName: string;
  userPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  locationName: string | null;
}

export interface TextCreatedPayload {
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  locationName: string | null;
}

export interface MomentCreatedPayload {
  userId: string;
  userName: string;
  userPhoto: string;
  emoji: string;
  text: string;
  placeName: string | null;
  expiresAt: number;
}

export interface ReelCreatedPayload {
  userId: string;
  userName: string;
  userPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  category: string;
  locationName: string | null;
  eventName: string | null;
}

export interface EventCreatedPayload {
  eventId: string;
  eventName: string;
  category: string;
  venue: string;
  bannerUrl: string;
  date: string;
  time: string;
  organizerName: string;
  organizerPhoto: string;
}

export interface PlaceCreatedPayload {
  placeId: string;
  placeName: string;
  category: string;
  coverUrl: string;
  rating: number;
  address: string;
}

export interface OfferCreatedPayload {
  offerId: string;
  title: string;
  discount: string;
  businessName: string;
  businessId: string;
  coverUrl: string;
  validUntil: string;
}

export interface RideCreatedPayload {
  rideId: string;
  driverName: string;
  driverPhoto: string;
  origin: string;
  destination: string;
  price: number;
  seatsAvailable: number;
}

export interface CheckinCreatedPayload {
  userId: string;
  userName: string;
  userPhoto: string;
  placeName: string;
  eventId: string | null;
  eventName: string | null;
  transition: "CHECKED_IN" | "LEFT";
  visibility: PresenceVisibilityValue;
}

export interface DriverOnlinePayload {
  driverId: string;
  driverName: string;
  driverPhoto: string;
  car: string;
  rating: number;
  lat: number;
  lng: number;
  serviceArea: string;
}

export interface DriverOfflinePayload {
  driverId: string;
  driverName: string;
}

export interface BusinessOnlinePayload {
  businessId: string;
  businessName: string;
  category: string;
  coverUrl: string;
}

export interface UserEnterAreaPayload {
  userId: string;
  userName: string;
  areaName: string;
  lat: number;
  lng: number;
}

export interface UserExitAreaPayload {
  userId: string;
  userName: string;
  areaName: string;
}

/* ─── Payload Union ──────────────────────────────────────── */

export type LiveEventPayload =
  | PhotoCreatedPayload
  | VideoCreatedPayload
  | TextCreatedPayload
  | MomentCreatedPayload
  | ReelCreatedPayload
  | EventCreatedPayload
  | PlaceCreatedPayload
  | OfferCreatedPayload
  | RideCreatedPayload
  | CheckinCreatedPayload
  | DriverOnlinePayload
  | DriverOfflinePayload
  | BusinessOnlinePayload
  | UserEnterAreaPayload
  | UserExitAreaPayload;

/* ─── Full Event ─────────────────────────────────────────── */

export interface LiveEvent<T extends LiveEventPayload = LiveEventPayload> extends LiveEventBase {
  payload: T;
}

/* ─── Event Type → Payload Mapping ───────────────────────── */

export type LiveEventPayloadMap = {
  [LiveEventType.PHOTO_CREATED]: PhotoCreatedPayload;
  [LiveEventType.VIDEO_CREATED]: VideoCreatedPayload;
  [LiveEventType.TEXT_CREATED]: TextCreatedPayload;
  [LiveEventType.MOMENT_CREATED]: MomentCreatedPayload;
  [LiveEventType.REEL_CREATED]: ReelCreatedPayload;
  [LiveEventType.EVENT_CREATED]: EventCreatedPayload;
  [LiveEventType.PLACE_CREATED]: PlaceCreatedPayload;
  [LiveEventType.OFFER_CREATED]: OfferCreatedPayload;
  [LiveEventType.RIDE_CREATED]: RideCreatedPayload;
  [LiveEventType.CHECKIN_CREATED]: CheckinCreatedPayload;
  [LiveEventType.DRIVER_ONLINE]: DriverOnlinePayload;
  [LiveEventType.DRIVER_OFFLINE]: DriverOfflinePayload;
  [LiveEventType.BUSINESS_ONLINE]: BusinessOnlinePayload;
  [LiveEventType.USER_ENTER_AREA]: UserEnterAreaPayload;
  [LiveEventType.USER_EXIT_AREA]: UserExitAreaPayload;
};

/* ─── Subscriber ─────────────────────────────────────────── */

export type LiveEventCallback<T extends LiveEventPayload = LiveEventPayload> = (
  event: LiveEvent<T>,
) => void;

export interface LiveSubscription {
  id: string;
  type: LiveEventTypeValue | "*";
  callback: LiveEventCallback;
}

/* ─── Helpers ────────────────────────────────────────────── */

let _nextId = 1;

export function generateLiveId(): string {
  return `live_${Date.now()}_${_nextId++}`;
}

/* ─── Event Display Metadata ─────────────────────────────── */

export const LIVE_EVENT_META: Record<
  LiveEventTypeValue,
  { emoji: string; label: string; category: "content" | "social" | "movement" | "business" }
> = {
  [LiveEventType.PHOTO_CREATED]: { emoji: "📷", label: "Foto publicada", category: "content" },
  [LiveEventType.VIDEO_CREATED]: { emoji: "🎥", label: "Video publicado", category: "content" },
  [LiveEventType.TEXT_CREATED]: { emoji: "✍", label: "Texto publicado", category: "content" },
  [LiveEventType.MOMENT_CREATED]: {
    emoji: "⚡",
    label: "Momento compartilhado",
    category: "social",
  },
  [LiveEventType.REEL_CREATED]: { emoji: "▶", label: "Reel publicado", category: "content" },
  [LiveEventType.EVENT_CREATED]: { emoji: "🎉", label: "Evento criado", category: "social" },
  [LiveEventType.PLACE_CREATED]: { emoji: "📍", label: "Local cadastrado", category: "business" },
  [LiveEventType.OFFER_CREATED]: { emoji: "🏷", label: "Oferta publicada", category: "business" },
  [LiveEventType.RIDE_CREATED]: { emoji: "🚗", label: "Carona disponivel", category: "movement" },
  [LiveEventType.CHECKIN_CREATED]: { emoji: "✅", label: "Check-in realizado", category: "social" },
  [LiveEventType.DRIVER_ONLINE]: { emoji: "🟢", label: "Motorista online", category: "movement" },
  [LiveEventType.DRIVER_OFFLINE]: { emoji: "🔴", label: "Motorista offline", category: "movement" },
  [LiveEventType.BUSINESS_ONLINE]: { emoji: "🏪", label: "Negocio ativo", category: "business" },
  [LiveEventType.USER_ENTER_AREA]: { emoji: "➡", label: "Entrou na area", category: "movement" },
  [LiveEventType.USER_EXIT_AREA]: { emoji: "⬅", label: "Saiu da area", category: "movement" },
};
