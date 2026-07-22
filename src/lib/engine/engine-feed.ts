import {
  type Recommendation,
  type EngineContext,
  type EngineUser,
  type RecommendationTypeValue,
  RecommendationType,
  ContextPeriod,
} from "./engine-types";

export function sortFeedItems(recs: Recommendation[], ctx: EngineContext): Recommendation[] {
  return [...recs]
    .map((r) => ({
      rec: r,
      boost: calculateFeedBoost(r, ctx),
    }))
    .sort((a, b) => {
      const scoreDiff = b.rec.score.total + b.boost - (a.rec.score.total + a.boost);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        new Date(b.rec.score.total).toString().length -
        new Date(a.rec.score.total).toString().length
      );
    })
    .map((item) => item.rec);
}

function calculateFeedBoost(rec: Recommendation, ctx: EngineContext): number {
  let boost = 0;

  if (ctx.period === ContextPeriod.NOITE && rec.type === RecommendationType.EVENT) {
    boost += 8;
  }

  if (ctx.period === ContextPeriod.MANHA && rec.type === RecommendationType.PLACE) {
    boost += 5;
  }

  if (ctx.period === ContextPeriod.TARDE && rec.type === RecommendationType.OFFER) {
    boost += 6;
  }

  if (rec.trending) {
    boost += 4;
  }

  if (rec.distanceMeters < 500) {
    boost += 3;
  }

  if (rec.score.total >= 80) {
    boost += 5;
  }

  return boost;
}

export function getFeedByType(
  recs: Recommendation[],
  type: RecommendationTypeValue,
): Recommendation[] {
  return recs.filter((r) => r.type === type).sort((a, b) => b.score.total - a.score.total);
}

export function getRelevantFeedItems(
  recs: Recommendation[],
  user: EngineUser,
  ctx: EngineContext,
): Recommendation[] {
  return sortFeedItems(recs, ctx).filter((r) => {
    if (r.score.total >= 50) return true;
    if (r.trending) return true;
    if (r.distanceMeters < 1000) return true;
    return false;
  });
}

export function getPeriodHighlights(recs: Recommendation[], ctx: EngineContext): Recommendation[] {
  return recs
    .filter((r) => {
      if (ctx.period === ContextPeriod.NOITE) {
        return r.type === RecommendationType.EVENT || r.type === RecommendationType.PLACE;
      }
      if (ctx.period === ContextPeriod.MANHA) {
        return r.type === RecommendationType.PLACE || r.type === RecommendationType.BUSINESS;
      }
      if (ctx.period === ContextPeriod.TARDE) {
        return r.type === RecommendationType.OFFER || r.type === RecommendationType.EVENT;
      }
      return true;
    })
    .sort((a, b) => b.score.total - a.score.total);
}
