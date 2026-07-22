/* ==== integration-engine.ts -- Main orchestrator for the Integration Hub
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  IntegrationActionValue,
  EngineIntegrationInput,
  ProfileStats,
  ProfileActivity,
  GeneratedNotification,
  IntegrationFeedItem,
  MapMarker,
  HeatLevelValue,
} from "./integration-types";
import { IntegrationAction, HeatLevel } from "./integration-types";
import { generateIntegrationId, haversineDistance } from "./integration-utils";

import { processEventsToFeedItems, rankFeedItems } from "./integration-feed";
import {
  createEventIntegration,
  toEngineEventInput,
  aggregateEventCheckins,
} from "./integration-events";
import {
  createCheckinEvent,
  aggregateCheckinsByEvent,
  getEventCheckinCounts,
  computePlaceStatusFromCheckins,
} from "./integration-checkin";
import {
  createDriverOnlineEvent,
  toEngineDriverInput,
  rankDriverMatches,
  aggregateDriverStatus,
} from "./integration-driver";
import {
  createMapState,
  addMarkers,
  getVisibleMarkers,
  sortMarkersByDistance,
  clusterMarkers,
  getMapStats,
} from "./integration-map";
import {
  createReelIntegrationEvent,
  toEngineReelInput,
  detectReelTrending,
} from "./integration-reels";
import {
  generateNotificationsFromEvent,
  sortByPriority,
  deduplicateNotifications,
} from "./integration-notifications";
import { computeProfileStats, generateProfileActivities } from "./integration-profile";
import {
  toEngineOfferInput,
  toEngineBusinessInput,
  aggregateOffersByBusiness,
  filterActiveOffers,
} from "./integration-marketplace";

import type {
  EventCheckinCounts,
  ProfileCheckinData,
  ProfileEventData,
  ProfileReelData,
  ProfileMomentData,
  ProfileConnectionData,
  ProfileMileData,
  MarketplaceBusinessData,
  MarketplaceOfferData,
  ReelIntegrationData,
  DriverIntegrationData,
} from "./integration-types";

/* ==== Integration engine state ==== */

export interface IntegrationEngineState {
  events: IntegrationEvent[];
  feed: IntegrationFeedItem[];
  mapMarkers: MapMarker[];
  notifications: GeneratedNotification[];
  profileStats: ProfileStats;
  profileActivities: ProfileActivity[];
  eventCheckinCounts: Map<string, EventCheckinCounts>;
  driverStatus: {
    totalOnline: number;
    totalAvailable: number;
    averageRating: number;
    areas: Map<string, number>;
  };
  reelTrending: Map<string, boolean>;
  marketplaceAggregation: Map<
    string,
    { businessName: string; offers: MarketplaceOfferData[]; totalDiscount: number }
  >;
}

/* ==== Create initial integration engine state ==== */

export function createIntegrationEngineState(
  userLat: number,
  userLng: number,
): IntegrationEngineState {
  return {
    events: [],
    feed: [],
    mapMarkers: createMapState(userLat, userLng).markers,
    notifications: [],
    profileStats: {
      visitedPlaces: 0,
      eventsAttended: 0,
      placesCheckedIn: 0,
      reelsPosted: 0,
      momentsPosted: 0,
      milesTraveled: 0,
      connectionsMade: 0,
    },
    profileActivities: [],
    eventCheckinCounts: new Map(),
    driverStatus: {
      totalOnline: 0,
      totalAvailable: 0,
      averageRating: 0,
      areas: new Map(),
    },
    reelTrending: new Map(),
    marketplaceAggregation: new Map(),
  };
}

/* ==== Process an integration event ==== */

export function processIntegrationEvent(
  state: IntegrationEngineState,
  event: IntegrationEvent,
  context: {
    userLat: number;
    userLng: number;
    friendIds: string[];
    followingIds: string[];
    userInterests: string[];
    favoritePlaceIds: string[];
    allReels: ReelIntegrationData[];
    allDrivers: DriverIntegrationData[];
    allBusinesses: MarketplaceBusinessData[];
    allOffers: MarketplaceOfferData[];
    allCheckins: ProfileCheckinData[];
    allEvents: ProfileEventData[];
    allReelData: ProfileReelData[];
    allMoments: ProfileMomentData[];
    allConnections: ProfileConnectionData[];
    allMiles: ProfileMileData[];
  },
): IntegrationEngineState {
  const newState = { ...state };
  newState.events = [...state.events, event];

  const feedItems = processEventsToFeedItems([event]);
  newState.feed = rankFeedItems([...state.feed, ...feedItems]);

  const notifications = generateNotificationsFromEvent(event, {
    friendIds: context.friendIds,
    followingIds: context.followingIds,
    userLat: context.userLat,
    userLng: context.userLng,
    favoritePlaceIds: context.favoritePlaceIds,
  });
  newState.notifications = deduplicateNotifications(
    sortByPriority([...state.notifications, ...notifications]),
  );

  switch (event.action) {
    case IntegrationAction.EVENT_CREATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "event" }>;
      const engineInput = toEngineEventInput(
        {
          eventId: p.eventId,
          name: p.eventName,
          category: p.category,
          venue: p.venue,
          lat: 0,
          lng: 0,
          startDate: p.startDate,
          endDate: p.endDate,
          attendeeCount: 0,
          heatLevel: HeatLevel.COLD,
          isActive: false,
          isUpcoming: true,
          feedGenerated: true,
          mapUpdated: false,
          notificationsSent: true,
          engineProcessed: false,
          reelsCreated: 0,
        },
        context.userLat,
        context.userLng,
      );
      break;
    }

    case IntegrationAction.CHECKIN_CREATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "checkin" }>;
      const newCheckin: ProfileCheckinData = {
        userId: p.userId,
        placeId: p.placeId ?? "",
        placeName: p.placeName ?? p.eventName,
        placeLat: p.placeLat ?? 0,
        placeLng: p.placeLng ?? 0,
        transition: p.transition,
        timestamp: event.timestamp,
      };
      const updatedCheckins = [...context.allCheckins, newCheckin];

      newState.eventCheckinCounts = aggregateCheckinsByEvent(updatedCheckins).reduce(
        (map, item) => {
          map.set(item.eventId, item);
          return map;
        },
        new Map<string, EventCheckinCounts>(),
      );

      newState.profileStats = computeProfileStats(
        updatedCheckins,
        context.allEvents,
        context.allReelData,
        context.allMoments,
        context.allConnections,
        context.allMiles,
        p.userId,
      );
      break;
    }

    case IntegrationAction.DRIVER_ONLINE: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "driver" }>;
      const updatedDrivers = [
        ...context.allDrivers,
        {
          driverId: p.driverId,
          driverName: p.driverName,
          driverPhoto: "",
          lat: p.lat,
          lng: p.lng,
          rating: 5.0,
          vehicle: p.vehicle,
          plate: "",
          serviceArea: p.serviceArea,
          isOnline: true,
          isAvailable: true,
        },
      ];
      newState.driverStatus = aggregateDriverStatus(updatedDrivers);
      break;
    }

    case IntegrationAction.REEL_POSTED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "reel" }>;
      const updatedReels: ReelIntegrationData[] = [
        ...context.allReelData.map((r) => ({
          reelId: r.reelId,
          authorId: r.userId,
          authorName: "",
          category: r.category,
          viewCount: r.viewCount,
          likeCount: r.likeCount,
          commentCount: 0,
          shareCount: 0,
          locationId: undefined,
          locationName: undefined,
          locationLat: undefined,
          locationLng: undefined,
          eventId: undefined,
          eventName: undefined,
          hashtags: [],
          createdAt: r.createdAt,
        })),
        {
          reelId: p.reelId,
          authorId: p.authorId,
          authorName: p.authorName,
          category: p.category,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          locationId: p.locationId,
          locationName: p.locationName,
          locationLat: undefined,
          locationLng: undefined,
          eventId: p.eventId,
          eventName: p.eventName,
          hashtags: [],
          createdAt: event.timestamp,
        },
      ];

      const reelData: ReelIntegrationData = {
        reelId: p.reelId,
        authorId: p.authorId,
        authorName: p.authorName,
        category: p.category,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        locationId: p.locationId,
        locationName: p.locationName,
        eventId: p.eventId,
        eventName: p.eventName,
        hashtags: [],
        createdAt: event.timestamp,
      };

      const trending = detectReelTrending(reelData, updatedReels);
      newState.reelTrending.set(p.reelId, trending.isTrending);
      break;
    }

    case IntegrationAction.OFFER_CREATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "offer" }>;
      const updatedOffers = [
        ...context.allOffers,
        {
          offerId: p.offerId,
          businessId: p.businessId,
          businessName: p.businessName,
          title: p.title,
          description: "",
          discountPercent: p.discountPercent,
          validFrom: event.timestamp,
          validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
          lat: p.lat,
          lng: p.lng,
          isClaimed: false,
        },
      ];
      newState.marketplaceAggregation = aggregateOffersByBusiness(updatedOffers);
      break;
    }

    case IntegrationAction.MOMENT_POSTED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "moment" }>;
      newState.profileStats = {
        ...state.profileStats,
        momentsPosted: state.profileStats.momentsPosted + 1,
      };
      break;
    }

    case IntegrationAction.PROFILE_UPDATED: {
      const p = event.payload as Extract<IntegrationPayload, { kind: "profile" }>;
      break;
    }
  }

  newState.profileActivities = generateProfileActivities(
    context.allCheckins,
    context.allEvents,
    context.allReelData,
    context.allMoments,
    context.allConnections,
    "",
  );

  return newState;
}

/* ==== Build engine integration input from state ==== */

export function buildEngineInput(
  state: IntegrationEngineState,
  businesses: MarketplaceBusinessData[],
  offers: MarketplaceOfferData[],
  drivers: DriverIntegrationData[],
  reels: ReelIntegrationData[],
  userLat: number,
  userLng: number,
  userInterests: string[],
): EngineIntegrationInput {
  return {
    events: state.events
      .filter((e) => e.action === IntegrationAction.EVENT_CREATED)
      .map((e) => {
        const p = e.payload as Extract<IntegrationPayload, { kind: "event" }>;
        return {
          id: p.eventId,
          name: p.eventName,
          category: p.category,
          venue: p.venue,
          lat: userLat,
          lng: userLng,
          startDate: p.startDate,
          endDate: p.endDate,
          attendeeCount: 0,
          isInterested: false,
          isAttending: false,
        };
      }),
    drivers: drivers.map((d) => toEngineDriverInput(d)),
    moments: [],
    reels: reels.map((r) => toEngineReelInput(r)),
    offers: offers.map((o) => toEngineOfferInput(o)),
    businesses: businesses.map((b) => toEngineBusinessInput(b)),
    rides: [],
    profiles: [],
    activities: [],
    locations: [],
    time: {
      period: "AFTERNOON",
      day: new Date().toLocaleDateString("pt-BR", { weekday: "long" }),
      hour: new Date().getHours(),
      isWeekend: [0, 6].includes(new Date().getDay()),
    },
    interests: userInterests,
    compatibility: [],
  };
}

/* ==== Full integration processing pipeline ==== */

export function processAllIntegrationData(context: {
  userLat: number;
  userLng: number;
  friendIds: string[];
  followingIds: string[];
  userInterests: string[];
  events: {
    id: string;
    name: string;
    category: string;
    venue: string;
    lat: number;
    lng: number;
    startDate: string;
    endDate: string;
    organizerId: string;
  }[];
  checkins: ProfileCheckinData[];
  drivers: DriverIntegrationData[];
  reels: ReelIntegrationData[];
  businesses: MarketplaceBusinessData[];
  offers: MarketplaceOfferData[];
  profileEvents: ProfileEventData[];
  profileReelData: ProfileReelData[];
  moments: ProfileMomentData[];
  connections: ProfileConnectionData[];
  miles: ProfileMileData[];
}): IntegrationEngineState {
  let state = createIntegrationEngineState(context.userLat, context.userLng);

  for (const event of context.events) {
    const integrationEvent = createEventIntegration(
      event.id,
      event.name,
      event.category,
      event.venue,
      event.lat,
      event.lng,
      event.startDate,
      event.endDate,
      event.organizerId,
    );
    state = processIntegrationEvent(state, integrationEvent, {
      userLat: context.userLat,
      userLng: context.userLng,
      friendIds: context.friendIds,
      followingIds: context.followingIds,
      userInterests: context.userInterests,
      favoritePlaceIds: [],
      allReels: context.reels,
      allDrivers: context.drivers,
      allBusinesses: context.businesses,
      allOffers: context.offers,
      allCheckins: context.checkins,
      allEvents: context.profileEvents,
      allReelData: context.profileReelData,
      allMoments: context.moments,
      allConnections: context.connections,
      allMiles: context.miles,
    });
  }

  for (const driver of context.drivers) {
    if (driver.isOnline) {
      const driverEvent = createDriverOnlineEvent(
        driver.driverId,
        driver.driverName,
        driver.lat,
        driver.lng,
        driver.serviceArea,
        driver.vehicle,
      );
      state = processIntegrationEvent(state, driverEvent, {
        userLat: context.userLat,
        userLng: context.userLng,
        friendIds: context.friendIds,
        followingIds: context.followingIds,
        userInterests: context.userInterests,
        favoritePlaceIds: [],
        allReels: context.reels,
        allDrivers: context.drivers,
        allBusinesses: context.businesses,
        allOffers: context.offers,
        allCheckins: context.checkins,
        allEvents: context.profileEvents,
        allReelData: context.profileReelData,
        allMoments: context.moments,
        allConnections: context.connections,
        allMiles: context.miles,
      });
    }
  }

  for (const reel of context.reels) {
    const reelEvent = createReelIntegrationEvent(
      reel.reelId,
      reel.authorId,
      reel.authorName,
      reel.category,
      reel.locationId,
      reel.locationName,
      reel.eventId,
      reel.eventName,
    );
    state = processIntegrationEvent(state, reelEvent, {
      userLat: context.userLat,
      userLng: context.userLng,
      friendIds: context.friendIds,
      followingIds: context.followingIds,
      userInterests: context.userInterests,
      favoritePlaceIds: [],
      allReels: context.reels,
      allDrivers: context.drivers,
      allBusinesses: context.businesses,
      allOffers: context.offers,
      allCheckins: context.checkins,
      allEvents: context.profileEvents,
      allReelData: context.profileReelData,
      allMoments: context.moments,
      allConnections: context.connections,
      allMiles: context.miles,
    });
  }

  state.profileStats = computeProfileStats(
    context.checkins,
    context.profileEvents,
    context.profileReelData,
    context.moments,
    context.connections,
    context.miles,
    "",
  );

  state.profileActivities = generateProfileActivities(
    context.checkins,
    context.profileEvents,
    context.profileReelData,
    context.moments,
    context.connections,
    "",
  );

  state.eventCheckinCounts = aggregateCheckinsByEvent(context.checkins).reduce((map, item) => {
    map.set(item.eventId, item);
    return map;
  }, new Map<string, EventCheckinCounts>());

  state.driverStatus = aggregateDriverStatus(context.drivers);
  state.marketplaceAggregation = aggregateOffersByBusiness(context.offers);

  return state;
}
