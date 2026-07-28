/* ============================================================
   CONNEXY
   Phase 8.5
   Live Ecosystem — Barrel Export
=========================================================== */

export { LiveEventType, LIVE_EVENT_META, generateLiveId } from "./live-events";
export type {
  LiveEvent,
  LiveEventTypeValue,
  LiveEventPayload,
  LiveEventCallback,
  LiveSubscription,
  LiveEventPayloadMap,
  PhotoCreatedPayload,
  VideoCreatedPayload,
  TextCreatedPayload,
  MomentCreatedPayload,
  ReelCreatedPayload,
  EventCreatedPayload,
  PlaceCreatedPayload,
  OfferCreatedPayload,
  RideCreatedPayload,
  CheckinCreatedPayload,
  DriverOnlinePayload,
  DriverOfflinePayload,
  BusinessOnlinePayload,
  UserEnterAreaPayload,
  UserExitAreaPayload,
} from "./live-events";

export {
  subscribeLiveEvent,
  unsubscribeLiveEvent,
  dispatchLiveEventRaw,
  getLiveEventHistory,
  getLiveEventHistoryByType,
  getRecentLiveEvents,
  clearLiveEventHistory,
  getSubscriberCount,
} from "./live-engine";

export {
  dispatchLiveEvent,
  dispatchPhotoCreated,
  dispatchVideoCreated,
  dispatchTextCreated,
  dispatchMomentCreated,
  dispatchReelCreated,
  dispatchEventCreated,
  dispatchPlaceCreated,
  dispatchOfferCreated,
  dispatchRideCreated,
  dispatchCheckinCreated,
  dispatchDriverOnline,
  dispatchDriverOffline,
  dispatchBusinessOnline,
  dispatchUserEnterArea,
  dispatchUserExitArea,
} from "./live-dispatcher";

export { useLiveEvent, useLiveEvents, useLiveUpdates, useLiveListener } from "./live-hooks";

export {
  getStoredLiveEvents,
  getStoredLiveEventsByType,
  storeLiveEvent,
  storeLiveEvents,
  clearStoredLiveEvents,
  getStoredEventCount,
} from "./live-storage";
