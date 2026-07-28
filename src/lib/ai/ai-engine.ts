/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Core Engine
   ConnexyAI class. Decides only. Never syncs. Never controls state.
   Consumes: Orchestrator, Context Engine, History Engine, Roles.
   Pure TypeScript. No React. No side effects.
============================================================ */

import { ConnexyOrchestrator } from "@/lib/orchestrator";
import { getCurrentContext } from "@/lib/context/context-engine";
import type { ContextState } from "@/lib/context/context-types";
import { getEntityCountMap, getTotalInteractions, getHistory } from "./ai-history";
import type { AIEntity, AIContextSignal, AIProfile, AIScore, AIEngineConfig } from "./ai-types";
import { buildFullScore } from "./ai-score";
import { sortByScore, top5, top10, top20, deduplicate } from "./ai-ranking";
import { rankFeed, rankFeedItems, feedItemToEntity } from "./ai-feed";
import { rankDrivers, rankDriversWithScores, type AIDriver } from "./ai-driver";
import { rankEvents, rankEventsWithScores, type AIEvent } from "./ai-events";
import { rankBusinesses, rankBusinessesWithScores, type AIBusiness } from "./ai-business";
import { rankOffers, rankOffersWithScores, type AIOffer } from "./ai-marketplace";
import { rankPeople, rankPeopleWithScores, type AIPerson } from "./ai-person";
import type { FeedItem } from "@/lib/feed/feed-types";

/* ─── Default Config ────────────────────────────────────── */

const DEFAULT_CONFIG: AIEngineConfig = {
  maxDistance: 5000,
  defaultLimit: 20,
  cacheTtlMs: 2 * 60 * 1000,
  historyMaxEntries: 5000,
};

/* ─── ConnexyAI Class ──────────────────────────────────── */

class ConnexyAICore {
  private config: AIEngineConfig;
  private contextCache: AIContextSignal | null = null;
  private contextCacheTime = 0;

  constructor(config: Partial<AIEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /* ─── Context ─────────────────────────────────────────── */

  private getContext(): AIContextSignal {
    const now = Date.now();
    if (this.contextCache && now - this.contextCacheTime < this.config.cacheTtlMs) {
      return this.contextCache;
    }

    const ctx: ContextState = getCurrentContext();
    this.contextCache = {
      period: ctx.period,
      environment: ctx.environment,
      movement: ctx.movement,
      weather: ctx.weather,
      nearEvents: ctx.nearEvents,
      nearBusinesses: ctx.nearBusinesses,
      nearDrivers: ctx.nearDrivers,
      nearPeople: ctx.nearPeople,
      hotArea: ctx.hotArea,
      role: ctx.currentRole,
    };
    this.contextCacheTime = now;
    return this.contextCache;
  }

  private getProfile(profile: AIProfile): AIProfile {
    return profile;
  }

  private getHistorySignals(): { historyMap: Map<string, number>; total: number } {
    return {
      historyMap: getEntityCountMap(),
      total: getTotalInteractions(),
    };
  }

  /* ─── Feed ─────────────────────────────────────────────── */

  getFeed(items: FeedItem[], profile: AIProfile): AIEntity[] {
    const context = this.getContext();
    const { historyMap, total } = this.getHistorySignals();
    return rankFeed(items, profile, context, historyMap, total);
  }

  getFeedItems(
    items: FeedItem[],
    profile: AIProfile,
  ): { items: FeedItem[]; scores: Map<string, AIScore> } {
    const context = this.getContext();
    const { historyMap, total } = this.getHistorySignals();
    return rankFeedItems(items, profile, context, historyMap, total);
  }

  /* ─── People ───────────────────────────────────────────── */

  getPeople(people: AIPerson[], profile: AIProfile): AIEntity[] {
    const context = this.getContext();
    const { historyMap, total } = this.getHistorySignals();
    return rankPeople(people, context, profile, historyMap, total);
  }

  getPeopleWithScores(
    people: AIPerson[],
    profile: AIProfile,
  ): { items: AIEntity[]; scores: Map<string, AIScore> } {
    const context = this.getContext();
    const { historyMap, total } = this.getHistorySignals();
    return rankPeopleWithScores(people, context, profile, historyMap, total);
  }

  /* ─── Drivers ──────────────────────────────────────────── */

  getDrivers(drivers: AIDriver[], profile: AIProfile): AIEntity[] {
    const context = this.getContext();
    return rankDrivers(drivers, context, profile);
  }

  getDriversWithScores(
    drivers: AIDriver[],
    profile: AIProfile,
  ): { items: AIEntity[]; scores: Map<string, AIScore> } {
    const context = this.getContext();
    return rankDriversWithScores(drivers, context, profile);
  }

  /* ─── Events ───────────────────────────────────────────── */

  getEvents(events: AIEvent[], profile: AIProfile): AIEntity[] {
    const context = this.getContext();
    return rankEvents(events, context, profile);
  }

  getEventsWithScores(
    events: AIEvent[],
    profile: AIProfile,
  ): { items: AIEntity[]; scores: Map<string, AIScore> } {
    const context = this.getContext();
    return rankEventsWithScores(events, context, profile);
  }

  /* ─── Businesses ───────────────────────────────────────── */

  getBusinesses(businesses: AIBusiness[], profile: AIProfile): AIEntity[] {
    const context = this.getContext();
    return rankBusinesses(businesses, context, profile);
  }

  getBusinessesWithScores(
    businesses: AIBusiness[],
    profile: AIProfile,
  ): { items: AIEntity[]; scores: Map<string, AIScore> } {
    const context = this.getContext();
    return rankBusinessesWithScores(businesses, context, profile);
  }

  /* ─── Offers ───────────────────────────────────────────── */

  getOffers(offers: AIOffer[], profile: AIProfile): AIEntity[] {
    const context = this.getContext();
    return rankOffers(offers, context, profile);
  }

  getOffersWithScores(
    offers: AIOffer[],
    profile: AIProfile,
  ): { items: AIEntity[]; scores: Map<string, AIScore> } {
    const context = this.getContext();
    return rankOffersWithScores(offers, context, profile);
  }

  /* ─── Recommendations (combined) ──────────────────────── */

  getRecommendations(
    profile: AIProfile,
    data: {
      feed?: FeedItem[];
      people?: AIPerson[];
      drivers?: AIDriver[];
      events?: AIEvent[];
      businesses?: AIBusiness[];
      offers?: AIOffer[];
    },
  ): {
    feed: AIEntity[];
    people: AIEntity[];
    drivers: AIEntity[];
    events: AIEntity[];
    businesses: AIEntity[];
    offers: AIEntity[];
    top: AIEntity[];
  } {
    const feed = data.feed ? this.getFeed(data.feed, profile) : [];
    const people = data.people ? this.getPeople(data.people, profile) : [];
    const drivers = data.drivers ? this.getDrivers(data.drivers, profile) : [];
    const events = data.events ? this.getEvents(data.events, profile) : [];
    const businesses = data.businesses ? this.getBusinesses(data.businesses, profile) : [];
    const offers = data.offers ? this.getOffers(data.offers, profile) : [];

    const all = deduplicate([...feed, ...people, ...drivers, ...events, ...businesses, ...offers]);
    const top = sortByScore(all).slice(0, this.config.defaultLimit);

    return { feed, people, drivers, events, businesses, offers, top };
  }

  /* ─── Top N shortcuts ──────────────────────────────────── */

  getTop5(items: AIEntity[]): AIEntity[] {
    return top5(items);
  }

  getTop10(items: AIEntity[]): AIEntity[] {
    return top10(items);
  }

  getTop20(items: AIEntity[]): AIEntity[] {
    return top20(items);
  }

  /* ─── Cache (delegates to Orchestrator) ────────────────── */

  getCached<T>(key: string): T | null {
    return ConnexyOrchestrator.getCache<T>(key);
  }

  setCached<T>(key: string, value: T, ttlMs?: number): void {
    ConnexyOrchestrator.setCache(key, value, "ai", ttlMs ?? this.config.cacheTtlMs);
  }

  invalidateCached(key: string): void {
    ConnexyOrchestrator.invalidateCache(key);
  }

  /* ─── Context cache invalidation ──────────────────────── */

  invalidateContext(): void {
    this.contextCache = null;
    this.contextCacheTime = 0;
  }

  /* ─── History access ───────────────────────────────────── */

  getHistory() {
    return getHistory();
  }

  /* ─── Config ───────────────────────────────────────────── */

  getConfig(): AIEngineConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<AIEngineConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}

/* ─── Singleton ─────────────────────────────────────────── */

export const ConnexyAI = new ConnexyAICore();
