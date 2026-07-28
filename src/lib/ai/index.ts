/* ============================================================
   CONNEXY
   Phase 9.1
   AI Decision Engine — Barrel Export
============================================================ */

export { ConnexyAI } from "./ai-engine";

export {
  AIEntityType,
  AI_WEIGHTS,
  AIHistoryAction,
  type AIEntityTypeValue,
  type AIEntity,
  type AIScore,
  type AIHistoryActionValue,
  type AIHistoryEntry,
  type AIContextSignal,
  type AIProfile,
  type AIRankedResult,
  type AIEngineConfig,
} from "./ai-types";

export {
  scoreDistance,
  scoreContext,
  scoreInterest,
  scoreHistory,
  scorePopularity,
  scoreTime,
  scoreActivity,
  calculateFinalScore,
  buildFullScore,
} from "./ai-score";

export {
  sortByScore,
  sortByPriority,
  rankEntities,
  top5,
  top10,
  top20,
  filterByType,
  deduplicate,
} from "./ai-ranking";

export {
  recordAction,
  getHistory,
  getHistoryForEntity,
  getHistoryForType,
  getHistoryForAction,
  getEntityInteractionCount,
  getTotalInteractions,
  getEntityCountMap,
  getTypeCountMap,
  cleanupOldHistory,
  clearHistory,
  invalidateHistoryCache,
} from "./ai-history";

export { rankFeed, rankFeedItems, feedItemToEntity } from "./ai-feed";

export { rankDrivers, rankDriversWithScores, scoreDriver, type AIDriver } from "./ai-driver";

export { rankEvents, rankEventsWithScores, scoreEvent, type AIEvent } from "./ai-events";

export {
  rankBusinesses,
  rankBusinessesWithScores,
  scoreBusiness,
  type AIBusiness,
} from "./ai-business";

export { rankOffers, rankOffersWithScores, scoreOffer, type AIOffer } from "./ai-marketplace";

export { rankPeople, rankPeopleWithScores, scorePerson, type AIPerson } from "./ai-person";

export { useAI, type UseAIReturn } from "./use-ai";
