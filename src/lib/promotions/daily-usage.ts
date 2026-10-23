/* =========================================================
   daily-usage.ts — Controle de exibição diária por campanha.
   Base da regra de "até três exibições por dia" no fuso
   America/Sao_Paulo. Compartilhado entre o popup promocional
   e a splash screen, mantendo o formato de dados e as chaves
   de armazenamento usados hoje.
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

export type DailyPeriod = "morning" | "afternoon" | "night";

export interface DailyUsage {
  date: string; // YYYY-MM-DD no fuso America/Sao_Paulo
  shownPeriods: DailyPeriod[];
}

/** Quantos períodos distintos existem por dia (limite diário). */
export const MAX_DAILY_PERIODS = 3;

/** Data e período atuais no horário de Brasília. */
export function brasiliaDateAndPeriod(
  now = new Date(),
): { date: string; period: DailyPeriod | null } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const date = `${get("year")}-${get("month")}-${get("day")}`;

  if (hour >= 6 && hour < 12) return { date, period: "morning" };
  if (hour >= 12 && hour < 18) return { date, period: "afternoon" };
  if (hour >= 18 && hour < 24) return { date, period: "night" };
  return { date, period: null };
}

/** Monta a chave de armazenamento de uma campanha. */
export function buildUsageKey(prefix: string, userId: string | null, campaignId: string): string {
  return `${prefix}:${userId ?? "anon"}:${campaignId}`;
}

/** Lê o uso diário de uma campanha, tratando dados inválidos. */
export function readDailyUsage(storageKey: string, date: string): DailyUsage {
  const empty: DailyUsage = { date, shownPeriods: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<DailyUsage>;
    if (parsed.date !== empty.date || !Array.isArray(parsed.shownPeriods)) return empty;
    return {
      date: empty.date,
      shownPeriods: parsed.shownPeriods.filter(
        (period): period is DailyPeriod =>
          period === "morning" || period === "afternoon" || period === "night",
      ),
    };
  } catch {
    return empty;
  }
}

/**
 * Registra uma impressão em um período do dia. Retorna false se o
 * período já tiver sido registrado (evita contagem duplicada).
 */
export function registerDailyImpression(
  storageKey: string,
  date: string,
  period: DailyPeriod,
): boolean {
  const usage = readDailyUsage(storageKey, date);
  if (usage.shownPeriods.includes(period)) return false;
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ ...usage, shownPeriods: [...usage.shownPeriods, period] }),
    );
  } catch {
    // Storage unavailable: the campaign may be shown again on a future visit.
  }
  return true;
}