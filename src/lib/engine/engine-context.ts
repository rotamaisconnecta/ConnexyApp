import {
  ContextPeriod,
  ContextDay,
  ContextLocation,
  type ContextPeriodValue,
  type ContextDayValue,
  type ContextLocationValue,
  type EngineUser,
  type EngineContext,
} from "./engine-types";

const DEFAULT_LAT = -23.5505;
const DEFAULT_LNG = -46.6333;

export function detectPeriod(hour: number): ContextPeriodValue {
  if (hour >= 6 && hour <= 11) return ContextPeriod.MANHA;
  if (hour >= 12 && hour <= 17) return ContextPeriod.TARDE;
  if (hour >= 18 && hour <= 23) return ContextPeriod.NOITE;
  return ContextPeriod.MADRUGADA;
}

export function detectDay(date: Date): ContextDayValue {
  const day = date.getDay();
  if (day === 0 || day === 6) return ContextDay.FIM_DE_SEMANA;
  return ContextDay.DIA_UTIL;
}

export function detectContextLocation(lat: number, _lng: number): ContextLocationValue {
  if (Math.abs(lat - DEFAULT_LAT) < 0.001) return ContextLocation.CASA;
  return ContextLocation.CENTRO;
}

export function buildContext(user: EngineUser): EngineContext {
  const now = new Date();
  const hour = now.getHours();
  return {
    period: detectPeriod(hour),
    day: detectDay(now),
    location: detectContextLocation(user.location.lat, user.location.lng),
    lat: user.location.lat,
    lng: user.location.lng,
    timestamp: now.toISOString(),
  };
}

const PERIOD_LABELS: Record<ContextPeriodValue, string> = {
  [ContextPeriod.MANHA]: "manhã",
  [ContextPeriod.TARDE]: "tarde",
  [ContextPeriod.NOITE]: "noite",
  [ContextPeriod.MADRUGADA]: "madrugada",
};

const DAY_LABELS: Record<ContextDayValue, string> = {
  [ContextDay.DIA_UTIL]: "de segunda a sexta",
  [ContextDay.FIM_DE_SEMANA]: "de sábado",
};

const LOCATION_LABELS: Record<ContextLocationValue, string> = {
  [ContextLocation.CASA]: "em casa",
  [ContextLocation.TRABALHO]: "no trabalho",
  [ContextLocation.EVENTO]: "num evento",
  [ContextLocation.CENTRO]: "no centro",
  [ContextLocation.SHOPPING]: "no shopping",
  [ContextLocation.UNIVERSIDADE]: "na universidade",
};

export function getContextLabel(ctx: EngineContext): string {
  const period = PERIOD_LABELS[ctx.period];
  const day =
    ctx.day === "FIM_DE_SEMANA"
      ? ctx.period === "MANHA"
        ? "de sábado"
        : "de sábado"
      : "de segunda a sexta";
  const location = LOCATION_LABELS[ctx.location];
  return `${period.charAt(0).toUpperCase() + period.slice(1)} ${day} ${location}`;
}

const PERIOD_EMOJIS: Record<ContextPeriodValue, string> = {
  [ContextPeriod.MANHA]: "🌅",
  [ContextPeriod.TARDE]: "☀️",
  [ContextPeriod.NOITE]: "🌙",
  [ContextPeriod.MADRUGADA]: "🌃",
};

export function getContextEmoji(ctx: EngineContext): string {
  return PERIOD_EMOJIS[ctx.period];
}

export function isWeekend(ctx: EngineContext): boolean {
  return ctx.day === ContextDay.FIM_DE_SEMANA;
}

export function isNightTime(ctx: EngineContext): boolean {
  return ctx.period === ContextPeriod.NOITE;
}

export function isMorning(ctx: EngineContext): boolean {
  return ctx.period === ContextPeriod.MANHA;
}
