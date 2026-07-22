import {
  type Recommendation,
  type EngineUser,
  type EngineContext,
  type EngineNotification,
  type RecommendationTypeValue,
  type TrendingPlace,
  type TrendingEvent,
  type TrendingBusiness,
  type TrendingPerson,
  type TrendingDriver,
  RecommendationType,
} from "./engine-types";

import { getReelRecommendations, getTrendingReels } from "./engine-reels";

import { getEventRecommendations, getPopularEvents } from "./engine-events";

import {
  getMarketplaceRecommendations,
  getBestOffers,
  getPopularBusinesses,
  getFollowedBusinesses,
} from "./engine-marketplace";

import { getDiscoveryRecommendations, getCompatiblePeople } from "./engine-discovery";

import { getDriverRecommendations, getNearestDrivers } from "./engine-driver";

import { generateSmartNotifications, prioritizeNotifications } from "./engine-notifications";

import {
  getTrendingPlaces as calcTrendingPlaces,
  getTrendingEvents as calcTrendingEvents,
  getTrendingBusinesses as calcTrendingBusinesses,
  getTrendingPeople as calcTrendingPeople,
  getTrendingDrivers as calcTrendingDrivers,
} from "./engine-trending";

export interface TrendingData {
  places: TrendingPlace[];
  events: TrendingEvent[];
  businesses: TrendingBusiness[];
  people: TrendingPerson[];
  drivers: TrendingDriver[];
}

export interface EngineState {
  user: EngineUser;
  context: EngineContext;
  recommendations: Recommendation[];
  trending: TrendingData;
}

export interface DashboardData {
  topPeople: Recommendation[];
  topEvents: Recommendation[];
  topBusinesses: Recommendation[];
  topPlaces: Recommendation[];
  topReels: Recommendation[];
  topDrivers: Recommendation[];
  topOffers: Recommendation[];
  notifications: EngineNotification[];
}

export function initializeEngine(user: EngineUser, context: EngineContext): EngineState {
  return {
    user,
    context,
    recommendations: [],
    trending: {
      places: [],
      events: [],
      businesses: [],
      people: [],
      drivers: [],
    },
  };
}

export function getRecommendations(
  state: EngineState,
  type?: RecommendationTypeValue,
): Recommendation[] {
  if (!type) {
    return [...state.recommendations].sort((a, b) => b.score.total - a.score.total);
  }

  return state.recommendations
    .filter((r) => r.type === type)
    .sort((a, b) => b.score.total - a.score.total);
}

export function refreshRecommendations(state: EngineState): EngineState {
  const recs = state.recommendations.map((r) => {
    let recalcTotal = r.score.total;

    if (state.context.day === "FIM_DE_SEMANA") {
      if (r.type === RecommendationType.EVENT) recalcTotal += 5;
      if (r.type === RecommendationType.PLACE) recalcTotal += 3;
    }

    if (r.distanceMeters < 1000) {
      recalcTotal += 3;
    }

    if (r.trending) {
      recalcTotal += 4;
    }

    return {
      ...r,
      score: {
        ...r.score,
        total: Math.min(100, Math.max(0, recalcTotal)),
      },
    };
  });

  return {
    ...state,
    recommendations: recs,
  };
}

export function getDashboardData(state: EngineState): DashboardData {
  const recs = state.recommendations;

  const topPeople = getDiscoveryRecommendations(recs, state.user).slice(0, 5);
  const topEvents = getEventRecommendations(recs, state.context).slice(0, 5);
  const topBusinesses = getPopularBusinesses(recs).slice(0, 5);
  const topPlaces = recs
    .filter((r) => r.type === RecommendationType.PLACE)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 5);
  const topReels = getReelRecommendations(recs, state.user).slice(0, 5);
  const topDrivers = getNearestDrivers(recs).slice(0, 5);
  const topOffers = getBestOffers(recs).slice(0, 5);

  const notifications = prioritizeNotifications(generateSmartNotifications(recs, state.context));

  return {
    topPeople,
    topEvents,
    topBusinesses,
    topPlaces,
    topReels,
    topDrivers,
    topOffers,
    notifications,
  };
}
