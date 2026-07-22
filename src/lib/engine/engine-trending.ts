import {
  type TrendingPlace,
  type TrendingEvent,
  type TrendingBusiness,
  type TrendingPerson,
  type TrendingDriver,
  type ActivityLevelValue,
  ActivityLevel,
} from "./engine-types";

const ACTIVITY_ORDER: ActivityLevelValue[] = [
  ActivityLevel.CALMO,
  ActivityLevel.MODERADO,
  ActivityLevel.EM_ALTA,
  ActivityLevel.BOMBANDO,
  ActivityLevel.MUITO_CHEIO,
];

export function calculateActivityLevel(
  checkIns: number,
  capacity: number,
): ActivityLevelValue {
  if (capacity <= 0) return ActivityLevel.CALMO;

  const ratio = checkIns / capacity;

  if (ratio < 0.2) return ActivityLevel.CALMO;
  if (ratio < 0.5) return ActivityLevel.MODERADO;
  if (ratio < 0.75) return ActivityLevel.EM_ALTA;
  if (ratio < 0.95) return ActivityLevel.BOMBANDO;
  return ActivityLevel.MUITO_CHEIO;
}

export function getTrendingPlaces(places: TrendingPlace[]): TrendingPlace[] {
  return places
    .filter((p) => p.trending)
    .sort((a, b) => {
      const aIdx = ACTIVITY_ORDER.indexOf(a.activityLevel);
      const bIdx = ACTIVITY_ORDER.indexOf(b.activityLevel);
      return bIdx - aIdx;
    });
}

export function getTrendingEvents(events: TrendingEvent[]): TrendingEvent[] {
  return events
    .filter((e) => e.trending)
    .sort((a, b) => b.attendingCount - a.attendingCount);
}

export function getTrendingBusinesses(
  businesses: TrendingBusiness[],
): TrendingBusiness[] {
  return businesses
    .filter((b) => b.trending)
    .sort((a, b) => b.rating - a.rating);
}

export function getTrendingPeople(people: TrendingPerson[]): TrendingPerson[] {
  return [...people].sort(
    (a, b) => b.compatibilityPercent - a.compatibilityPercent,
  );
}

export function getTrendingDrivers(drivers: TrendingDriver[]): TrendingDriver[] {
  return [...drivers].sort((a, b) => {
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    const aScore = a.rating * 10 - a.etaMinutes;
    const bScore = b.rating * 10 - b.etaMinutes;
    return bScore - aScore;
  });
}

export function isActivityLevel(
  level: ActivityLevelValue,
  min: ActivityLevelValue,
): boolean {
  const levelIdx = ACTIVITY_ORDER.indexOf(level);
  const minIdx = ACTIVITY_ORDER.indexOf(min);
  return levelIdx >= minIdx;
}
