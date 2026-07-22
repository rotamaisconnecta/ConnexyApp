import {
  type Recommendation,
  type EngineContext,
  type RecommendationTypeValue,
  RecommendationType,
  ContextDay,
  ContextPeriod,
} from "./engine-types";

export function getEventRecommendations(
  recs: Recommendation[],
  ctx: EngineContext,
): Recommendation[] {
  const events = recs.filter((r) => r.type === RecommendationType.EVENT);
  const now = new Date(ctx.timestamp);

  return events.sort((a, b) => {
    const aMeta = a.metadata.kind === "event" ? a.metadata : null;
    const bMeta = b.metadata.kind === "event" ? b.metadata : null;
    if (!aMeta || !bMeta) return 0;

    const aDate = new Date(aMeta.date);
    const bDate = new Date(bMeta.date);

    const aIsToday = aDate.toDateString() === now.toDateString();
    const bIsToday = bDate.toDateString() === now.toDateString();
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    const aIsFuture = aDate >= now;
    const bIsFuture = bDate >= now;
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;

    return b.score.total - a.score.total;
  });
}

export function getUpcomingEvents(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.EVENT)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "event" ? a.metadata : null;
      const bMeta = b.metadata.kind === "event" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return new Date(aMeta.date).getTime() - new Date(bMeta.date).getTime();
    });
}

export function getPopularEvents(recs: Recommendation[]): Recommendation[] {
  return recs
    .filter((r) => r.type === RecommendationType.EVENT)
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "event" ? a.metadata : null;
      const bMeta = b.metadata.kind === "event" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.attendingCount - aMeta.attendingCount;
    });
}

export function getNearbyEvents(
  recs: Recommendation[],
  maxDistance: number = 5000,
): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.EVENT && r.distanceMeters <= maxDistance,
    )
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function shouldPrioritizeEvent(
  event: Recommendation,
  ctx: EngineContext,
): boolean {
  if (event.type !== RecommendationType.EVENT) return false;

  const meta = event.metadata.kind === "event" ? event.metadata : null;
  if (!meta) return false;

  const now = new Date(ctx.timestamp);
  const eventDate = new Date(meta.date);
  const isSameDay = now.toDateString() === eventDate.toDateString();

  if (isSameDay) {
    if (ctx.day === ContextDay.FIM_DE_SEMANA) {
      return meta.attendingCount > 5;
    }
    if (
      ctx.period === ContextPeriod.TARDE ||
      ctx.period === ContextPeriod.NOITE
    ) {
      return meta.attendingCount > 0;
    }
  }

  if (
    ctx.day === ContextDay.FIM_DE_SEMANA &&
    meta.attendingCount > 20
  ) {
    return true;
  }

  return false;
}
