/* =========================================================
   splash-frequency.ts — Frequência de exibição da splash por
   campanha: até três exibições por dia no fuso America/Sao_Paulo.
   Identificador de campanha próprio e estável, separado do popup
   promocional, para não compartilhar contagens acidentalmente.
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import {
  brasiliaDateAndPeriod,
  buildUsageKey,
  MAX_DAILY_PERIODS,
  readDailyUsage,
  registerDailyImpression,
  type DailyPeriod,
} from "@/lib/promotions/daily-usage";

/** Identificador estável da campanha da splash. */
export const SPLASH_CAMPAIGN_ID = "splash-campaign-v1";

/** Prefixo próprio da splash, separado de connexy:promotion-usage. */
export const SPLASH_USAGE_PREFIX = "connexy:splash-usage";

/** Limite diário de exibições da splash. */
export const MAX_SPLASH_PER_DAY = MAX_DAILY_PERIODS;

export function getSplashUsageKey(userId: string | null): string {
  return buildUsageKey(SPLASH_USAGE_PREFIX, userId, SPLASH_CAMPAIGN_ID);
}

/** Períodos já exibidos hoje para a campanha da splash. */
export function splashDailyUsage(
  userId: string | null,
  now = new Date(),
): { date: string; period: DailyPeriod | null; shownPeriods: DailyPeriod[] } {
  const { date, period } = brasiliaDateAndPeriod(now);
  if (!period) return { date, period, shownPeriods: [] };
  return { date, period, shownPeriods: readDailyUsage(getSplashUsageKey(userId), date).shownPeriods };
}

/** Quantidade de impressões da splash registradas hoje. */
export function splashDailyCount(userId: string | null, now = new Date()): number {
  return splashDailyUsage(userId, now).shownPeriods.length;
}

/** A splash pode ser exibida agora para esta campanha (limite e período). */
export function canShowSplash(userId: string | null, now = new Date()): boolean {
  const { date, period, shownPeriods } = splashDailyUsage(userId, now);
  if (!period) return false;
  return (
    !shownPeriods.includes(period) && shownPeriods.length < MAX_SPLASH_PER_DAY
  );
}

/**
 * Registra a impressão apenas quando a splash realmente foi exibida.
 * Retorna false se o período atual já estava registrado (sem duplicar).
 */
export function registerSplashImpression(userId: string | null, now = new Date()): boolean {
  const { date, period } = brasiliaDateAndPeriod(now);
  if (!period) return false;
  return registerDailyImpression(getSplashUsageKey(userId), date, period);
}