/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — React Hook
   Allows any component to use: const ai = useAI();
   React only. Uses ConnexyAI singleton.
============================================================ */

import { useState, useCallback, useMemo, useRef } from "react";
import { ConnexyAI } from "./ai-engine";
import type { AIEntity, AIProfile, AIScore, AIContextSignal, AIHistoryEntry } from "./ai-types";
import type { AIDriver } from "./ai-driver";
import type { AIEvent } from "./ai-events";
import type { AIBusiness } from "./ai-business";
import type { AIOffer } from "./ai-marketplace";
import type { AIPerson } from "./ai-person";
import type { FeedItem } from "@/lib/feed/feed-types";

/* ─── Return Type ───────────────────────────────────────── */

export interface UseAIReturn {
  getFeed: (items: FeedItem[], profile: AIProfile) => AIEntity[];
  getPeople: (people: AIPerson[], profile: AIProfile) => AIEntity[];
  getDrivers: (drivers: AIDriver[], profile: AIProfile) => AIEntity[];
  getEvents: (events: AIEvent[], profile: AIProfile) => AIEntity[];
  getBusinesses: (businesses: AIBusiness[], profile: AIProfile) => AIEntity[];
  getOffers: (offers: AIOffer[], profile: AIProfile) => AIEntity[];
  getRecommendations: (
    profile: AIProfile,
    data: {
      feed?: FeedItem[];
      people?: AIPerson[];
      drivers?: AIDriver[];
      events?: AIEvent[];
      businesses?: AIBusiness[];
      offers?: AIOffer[];
    },
  ) => {
    feed: AIEntity[];
    people: AIEntity[];
    drivers: AIEntity[];
    events: AIEntity[];
    businesses: AIEntity[];
    offers: AIEntity[];
    top: AIEntity[];
  };
  getTop5: (items: AIEntity[]) => AIEntity[];
  getTop10: (items: AIEntity[]) => AIEntity[];
  getTop20: (items: AIEntity[]) => AIEntity[];
  invalidateContext: () => void;
  getHistory: () => AIHistoryEntry[];
  getCached: <T>(key: string) => T | null;
  setCached: <T>(key: string, value: T, ttlMs?: number) => void;
}

/* ─── useAI Hook ────────────────────────────────────────── */

export function useAI(): UseAIReturn {
  const [, forceUpdate] = useState(0);
  const versionRef = useRef(0);

  const invalidateContext = useCallback(() => {
    ConnexyAI.invalidateContext();
    versionRef.current += 1;
    forceUpdate(versionRef.current);
  }, []);

  const getFeed = useCallback((items: FeedItem[], profile: AIProfile): AIEntity[] => {
    return ConnexyAI.getFeed(items, profile);
  }, []);

  const getPeople = useCallback((people: AIPerson[], profile: AIProfile): AIEntity[] => {
    return ConnexyAI.getPeople(people, profile);
  }, []);

  const getDrivers = useCallback((drivers: AIDriver[], profile: AIProfile): AIEntity[] => {
    return ConnexyAI.getDrivers(drivers, profile);
  }, []);

  const getEvents = useCallback((events: AIEvent[], profile: AIProfile): AIEntity[] => {
    return ConnexyAI.getEvents(events, profile);
  }, []);

  const getBusinesses = useCallback((businesses: AIBusiness[], profile: AIProfile): AIEntity[] => {
    return ConnexyAI.getBusinesses(businesses, profile);
  }, []);

  const getOffers = useCallback((offers: AIOffer[], profile: AIProfile): AIEntity[] => {
    return ConnexyAI.getOffers(offers, profile);
  }, []);

  const getRecommendations = useCallback(
    (
      profile: AIProfile,
      data: {
        feed?: FeedItem[];
        people?: AIPerson[];
        drivers?: AIDriver[];
        events?: AIEvent[];
        businesses?: AIBusiness[];
        offers?: AIOffer[];
      },
    ) => {
      return ConnexyAI.getRecommendations(profile, data);
    },
    [],
  );

  const getTop5 = useCallback((items: AIEntity[]): AIEntity[] => {
    return ConnexyAI.getTop5(items);
  }, []);

  const getTop10 = useCallback((items: AIEntity[]): AIEntity[] => {
    return ConnexyAI.getTop10(items);
  }, []);

  const getTop20 = useCallback((items: AIEntity[]): AIEntity[] => {
    return ConnexyAI.getTop20(items);
  }, []);

  const getHistory = useCallback(() => {
    return ConnexyAI.getHistory();
  }, []);

  const getCached = useCallback(<T>(key: string): T | null => {
    return ConnexyAI.getCached<T>(key);
  }, []);

  const setCached = useCallback(<T>(key: string, value: T, ttlMs?: number) => {
    ConnexyAI.setCached(key, value, ttlMs);
  }, []);

  return useMemo(
    () => ({
      getFeed,
      getPeople,
      getDrivers,
      getEvents,
      getBusinesses,
      getOffers,
      getRecommendations,
      getTop5,
      getTop10,
      getTop20,
      invalidateContext,
      getHistory,
      getCached,
      setCached,
    }),
    [
      getFeed,
      getPeople,
      getDrivers,
      getEvents,
      getBusinesses,
      getOffers,
      getRecommendations,
      getTop5,
      getTop10,
      getTop20,
      invalidateContext,
      getHistory,
      getCached,
      setCached,
    ],
  );
}
