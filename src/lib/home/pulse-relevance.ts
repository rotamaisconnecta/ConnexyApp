import { periodFromHour } from "@/lib/context/context-detector";
import { ContextPeriod, type ContextPeriodValue } from "@/lib/context/context-types";
import { BusinessCategory } from "@/lib/marketplace/business-types";
import type { Business, BusinessHoursSlot, DayOfWeekValue } from "@/lib/marketplace/business-types";
import { DayOfWeek } from "@/lib/marketplace/business-types";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
const CONTEXTUAL_RADIUS_METERS = 2000;

export type PulseTemporalState =
  | "happening"
  | "startingSoon"
  | "openNow"
  | "todayLater"
  | "tomorrow"
  | "upcoming"
  | "past"
  | "unknown";

export type PulseRankable = {
  distanceMeters: number;
  kind?: string;
  category?: string;
  title?: string;
  summary?: string;
  tags?: string[];
  openNow?: boolean;
  isActiveOffer?: boolean;
  startAt?: number;
  endAt?: number;
  createdAt?: number;
  favorite?: boolean;
};

const DAY_FROM_JS: DayOfWeekValue[] = [
  DayOfWeek.SUN,
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
];

const PERIOD_HINTS: Record<ContextPeriodValue, string[]> = {
  [ContextPeriod.MORNING]: [
    "cafe",
    "café",
    "cafeteria",
    "padaria",
    "bakery",
    "salgado",
    "breakfast",
    "manhã",
    "morning",
    "yoga",
    "bem-estar",
    "gym",
    "academia",
  ],
  [ContextPeriod.AFTERNOON]: [
    "restaurant",
    "restaurante",
    "almoço",
    "almoco",
    "cafe",
    "café",
    "petisco",
    "loja",
    "store",
    "atividade",
    "gastronomia",
    "gym",
    "academia",
  ],
  [ContextPeriod.EVENING]: [
    "restaurant",
    "restaurante",
    "bar",
    "petisco",
    "boate",
    "música",
    "musica",
    "entertainment",
    "show",
    "jazz",
    "noite",
  ],
  [ContextPeriod.NIGHT]: [
    "restaurant",
    "restaurante",
    "bar",
    "petisco",
    "boate",
    "música",
    "musica",
    "entertainment",
    "show",
    "jazz",
    "noite",
  ],
};

const CATEGORY_PERIODS: Record<string, ContextPeriodValue[]> = {
  [BusinessCategory.CAFE]: [ContextPeriod.MORNING, ContextPeriod.AFTERNOON],
  [BusinessCategory.RESTAURANT]: [
    ContextPeriod.AFTERNOON,
    ContextPeriod.EVENING,
    ContextPeriod.NIGHT,
  ],
  [BusinessCategory.BAR]: [ContextPeriod.EVENING, ContextPeriod.NIGHT],
  [BusinessCategory.STORE]: [ContextPeriod.AFTERNOON],
  [BusinessCategory.ENTERTAINMENT]: [ContextPeriod.EVENING, ContextPeriod.NIGHT],
  [BusinessCategory.GYM]: [ContextPeriod.MORNING, ContextPeriod.AFTERNOON],
  [BusinessCategory.EVENTS]: [
    ContextPeriod.AFTERNOON,
    ContextPeriod.EVENING,
    ContextPeriod.NIGHT,
  ],
};

function parseClock(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function tomorrowOf(now: Date): Date {
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function haystackOf(item: PulseRankable): string {
  return fold([item.kind, item.category, item.title, item.summary, ...(item.tags ?? [])]
    .filter(Boolean)
    .join(" "));
}

export function isBusinessOpenAt(business: Business, now: Date): boolean {
  const slot = business.hours.find((entry) => entry.day === DAY_FROM_JS[now.getDay()]);
  if (slot) return isHoursSlotOpen(slot, now);
  return business.isOpen;
}

export function isHoursSlotOpen(slot: BusinessHoursSlot, now: Date): boolean {
  if (slot.closed) return false;
  const open = parseClock(slot.open);
  const close = parseClock(slot.close);
  if (open == null || close == null) return false;
  const current = minutesOf(now);
  if (close < open) return current >= open || current < close;
  return current >= open && current < close;
}

export function isPlaceOpenAt(hours: string, now: Date): boolean {
  const until = hours.match(/aberto até\s+(\d{1,2}):(\d{2})/i);
  if (!until) return false;
  const closeHour = Number(until[1]);
  const closeMinutes = (closeHour === 0 ? 24 : closeHour) * 60 + Number(until[2]);
  const current = minutesOf(now);
  const opens = 6 * 60;
  return current >= opens && current < closeMinutes;
}

export function eventWindow(startAt: number, endAt: number | undefined, now: Date): PulseTemporalState {
  const start = new Date(startAt);
  const end = new Date(endAt ?? startAt + EVENT_DURATION_MS);
  const current = now.getTime();
  if (current >= start.getTime() && current <= end.getTime()) return "happening";
  if (current < start.getTime() && start.getTime() - current <= TWO_HOURS_MS) return "startingSoon";
  if (sameCalendarDay(start, now) && current < start.getTime()) return "todayLater";
  const tomorrow = tomorrowOf(now);
  if (sameCalendarDay(start, tomorrow)) return "tomorrow";
  if (start.getTime() > tomorrow.getTime()) return "upcoming";
  return "past";
}

export function temporalState(item: PulseRankable, now: Date): PulseTemporalState {
  if (item.startAt != null) return eventWindow(item.startAt, item.endAt, now);
  if (item.openNow || item.isActiveOffer) return "openNow";
  return "unknown";
}

export function matchesDayPeriod(item: PulseRankable, period: ContextPeriodValue): boolean {
  if (item.startAt != null) {
    if (periodFromHour(new Date(item.startAt).getHours()) === period) return true;
  }
  const category = item.category ?? "";
  if (CATEGORY_PERIODS[category]?.includes(period)) return true;
  const haystack = haystackOf(item);
  return PERIOD_HINTS[period].some((hint) => haystack.includes(fold(hint)));
}

function happeningRank(state: PulseTemporalState): number {
  return state === "happening" || state === "startingSoon" ? 0 : 1;
}

function openRank(item: PulseRankable, state: PulseTemporalState): number {
  if (item.openNow || item.isActiveOffer || state === "openNow") return 0;
  return 1;
}

export function proximityBand(meters: number): number {
  if (meters <= 400) return 0;
  if (meters <= 1000) return 1;
  if (meters <= CONTEXTUAL_RADIUS_METERS) return 2;
  if (meters <= 5000) return 3;
  return 4;
}

function recencyBand(item: PulseRankable, now: Date): number {
  if (item.createdAt != null) {
    const age = now.getTime() - item.createdAt;
    if (age >= 0 && age <= 24 * 60 * 60 * 1000) return 0;
    if (age >= 0 && age <= 7 * 24 * 60 * 60 * 1000) return 1;
    return 2;
  }
  const state = temporalState(item, now);
  if (state === "happening" || state === "startingSoon") return 0;
  if (state === "todayLater") return 1;
  return 2;
}

function socialBand(item: PulseRankable): number {
  return item.favorite ? 0 : 1;
}

function futureBand(state: PulseTemporalState): number {
  switch (state) {
    case "happening":
    case "startingSoon":
    case "openNow":
      return 0;
    case "todayLater":
      return 1;
    case "tomorrow":
      return 2;
    case "upcoming":
      return 3;
    case "past":
      return 4;
    default:
      return 3;
  }
}

export function pulseRankTuple(item: PulseRankable, now: Date): number[] {
  const period = periodFromHour(now.getHours());
  const state = temporalState(item, now);
  return [
    happeningRank(state),
    openRank(item, state),
    matchesDayPeriod(item, period) ? 0 : 1,
    proximityBand(item.distanceMeters),
    recencyBand(item, now),
    socialBand(item),
    futureBand(state),
  ];
}

export function comparePulseRelevance(a: PulseRankable, b: PulseRankable, now: Date): number {
  const left = pulseRankTuple(a, now);
  const right = pulseRankTuple(b, now);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return a.distanceMeters - b.distanceMeters;
}

export function rankPulseItems<T extends PulseRankable>(items: readonly T[], now: Date = new Date()): T[] {
  return [...items].sort((a, b) => comparePulseRelevance(a, b, now));
}

export function pulseMetaLine(whenLabel?: string, whereLabel?: string): string | undefined {
  const parts = [whenLabel, whereLabel].filter((part) => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export { periodFromHour };
