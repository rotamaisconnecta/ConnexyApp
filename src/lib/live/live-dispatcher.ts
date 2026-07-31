/* ============================================================
   CONNEXY
   Phase 8.5
   Live Ecosystem — Dispatcher
   High-level dispatch with side effects.
   Pure functions. No React. No side effects on import.
=========================================================== */

import type { LiveEvent, LiveEventPayload, LiveEventTypeValue } from "./live-events";
import { LiveEventType, generateLiveId } from "./live-events";
import { dispatchLiveEventRaw } from "./live-engine";
import { storeLiveEvent } from "./live-storage";
import type { PresenceVisibilityValue } from "@/lib/event-checkin/checkin-types";

/* ─── Dispatch ───────────────────────────────────────────── */

export function dispatchLiveEvent<T extends LiveEventPayload>(
  type: LiveEventTypeValue,
  payload: T,
  source: string = "app",
): LiveEvent<T> {
  const event: LiveEvent<T> = {
    id: generateLiveId(),
    type,
    timestamp: Date.now(),
    source,
    payload,
  };

  dispatchLiveEventRaw(event);
  storeLiveEvent(event);

  return event;
}

/* ─── Convenience Dispatchers ────────────────────────────── */

export function dispatchPhotoCreated(data: {
  userId: string;
  userName: string;
  userPhoto: string;
  photoUrl: string;
  caption: string;
  locationName: string | null;
  interests: string[];
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.PHOTO_CREATED, data);
}

export function dispatchVideoCreated(data: {
  userId: string;
  userName: string;
  userPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  locationName: string | null;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.VIDEO_CREATED, data);
}

export function dispatchTextCreated(data: {
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  locationName: string | null;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.TEXT_CREATED, data);
}

export function dispatchMomentCreated(data: {
  userId: string;
  userName: string;
  userPhoto: string;
  emoji: string;
  text: string;
  placeName: string | null;
  expiresAt: number;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.MOMENT_CREATED, data);
}

export function dispatchReelCreated(data: {
  userId: string;
  userName: string;
  userPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  category: string;
  locationName: string | null;
  eventName: string | null;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.REEL_CREATED, data);
}

export function dispatchEventCreated(data: {
  eventId: string;
  eventName: string;
  category: string;
  venue: string;
  bannerUrl: string;
  date: string;
  time: string;
  organizerName: string;
  organizerPhoto: string;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.EVENT_CREATED, data);
}

export function dispatchPlaceCreated(data: {
  placeId: string;
  placeName: string;
  category: string;
  coverUrl: string;
  rating: number;
  address: string;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.PLACE_CREATED, data);
}

export function dispatchOfferCreated(data: {
  offerId: string;
  title: string;
  discount: string;
  businessName: string;
  businessId: string;
  coverUrl: string;
  validUntil: string;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.OFFER_CREATED, data);
}

export function dispatchRideCreated(data: {
  rideId: string;
  driverName: string;
  driverPhoto: string;
  origin: string;
  destination: string;
  price: number;
  seatsAvailable: number;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.RIDE_CREATED, data);
}

export function dispatchCheckinCreated(data: {
  userId: string;
  userName: string;
  userPhoto: string;
  placeName: string;
  eventId: string | null;
  eventName: string | null;
  transition: "CHECKED_IN" | "LEFT";
  visibility: PresenceVisibilityValue;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.CHECKIN_CREATED, data);
}

export function dispatchDriverOnline(data: {
  driverId: string;
  driverName: string;
  driverPhoto: string;
  car: string;
  rating: number;
  lat: number;
  lng: number;
  serviceArea: string;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.DRIVER_ONLINE, data);
}

export function dispatchDriverOffline(data: { driverId: string; driverName: string }): LiveEvent {
  return dispatchLiveEvent(LiveEventType.DRIVER_OFFLINE, data);
}

export function dispatchBusinessOnline(data: {
  businessId: string;
  businessName: string;
  category: string;
  coverUrl: string;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.BUSINESS_ONLINE, data);
}

export function dispatchUserEnterArea(data: {
  userId: string;
  userName: string;
  areaName: string;
  lat: number;
  lng: number;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.USER_ENTER_AREA, data);
}

export function dispatchUserExitArea(data: {
  userId: string;
  userName: string;
  areaName: string;
}): LiveEvent {
  return dispatchLiveEvent(LiveEventType.USER_EXIT_AREA, data);
}
