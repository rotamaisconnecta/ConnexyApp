/* =========================================================
   ad-metrics.ts — Métricas locais de impressões e cliques em
   anúncios patrocinados.

   Só registra eventos quando a UI confirma a exibição (impressão)
   ou o acionamento de clique. O módulo é passivo: nunca decide
   exibição, nunca altera budget, nunca chama servidores.

   Persistência: localStorage sob a chave connexy:demo:ad-metrics:v1
   (versão 1). Histórico limitado a MAX_AD_METRIC_EVENTS registros,
   preservando os mais recentes.

   Dados pessoais: nenhum nome, telefone ou localização é gravado.
   A identidade de campanha é registrada somente quando existe de
   verdade; caso contrário fica null (nunca é inventada).

   Pure TypeScript. No React. Sem fetch. Sem Supabase.
========================================================= */

import { demoStorageKey } from "@/lib/demo/demo-config";

export const AD_METRICS_STORAGE_KEY = demoStorageKey("ad-metrics:v1");

/** Limite do histórico armazenado — evita crescimento ilimitado. */
export const MAX_AD_METRIC_EVENTS = 2_000;

/** Posicionamentos instrumentados desta fase. */
export const AD_PLACEMENTS = {
  HOME_REGIONAL_HIGHLIGHTS: "home_regional_highlights",
  POST_RIDE_DISCOVERY: "post_ride_discovery",
  HOME_PREMIUM: "home_premium",
} as const;

export type AdPlacementId = (typeof AD_PLACEMENTS)[keyof typeof AD_PLACEMENTS];

export type AdMetricType = "impression" | "click";

export interface AdMetricEvent {
  id: string;
  type: AdMetricType;
  ad: string;
  placement: string;
  campaignId: string | null;
  advertiserId: string | null;
  at: string;
}

export type AdMetricInput = {
  type: AdMetricType;
  ad: string;
  placement: string;
  campaignId?: string | null;
  advertiserId?: string | null;
};

export type AdEventIdGenerator = (now: number) => string;

let eventSequence = 0;

function randomSuffix(): string {
  // Math.random é suficiente para distinguir eventos no mesmo cliente.
  return Math.random().toString(36).slice(2, 8);
}

/** Identificador único do evento, legível e local. */
export function uniqueEventId(now = Date.now()): string {
  eventSequence = (eventSequence + 1) % Number.MAX_SAFE_INTEGER;
  return `evt-${now.toString(36)}-${eventSequence.toString(36)}-${randomSuffix()}`;
}

/**
 * Coagem de um registro lido do storage. Eventos malformados retornam
 * null e são ignorados no carregamento (não quebram a leitura).
 */
export function sanitizeAdMetricEvent(input: unknown): AdMetricEvent | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (raw.type !== "impression" && raw.type !== "click") return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.ad !== "string" || !raw.ad) return null;
  if (typeof raw.placement !== "string" || !raw.placement) return null;
  if (typeof raw.at !== "string" || Number.isNaN(Date.parse(raw.at))) return null;
  return {
    id: raw.id,
    type: raw.type,
    ad: raw.ad,
    placement: raw.placement,
    campaignId: typeof raw.campaignId === "string" && raw.campaignId ? raw.campaignId : null,
    advertiserId: typeof raw.advertiserId === "string" && raw.advertiserId ? raw.advertiserId : null,
    at: raw.at,
  };
}

/** Valida e monta um evento a partir de uma entrada da aplicação. */
export function buildAdMetricEvent(
  input: AdMetricInput,
  now = new Date(),
  idGen: AdEventIdGenerator = uniqueEventId,
): AdMetricEvent | null {
  if (input.type !== "impression" && input.type !== "click") return null;
  if (typeof input.ad !== "string" || !input.ad.trim()) return null;
  if (typeof input.placement !== "string" || !input.placement.trim()) return null;
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) return null;
  return {
    id: idGen(timestamp),
    type: input.type,
    ad: input.ad.trim(),
    placement: input.placement.trim(),
    campaignId:
      typeof input.campaignId === "string" && input.campaignId ? input.campaignId : null,
    advertiserId:
      typeof input.advertiserId === "string" && input.advertiserId ? input.advertiserId : null,
    at: now.toISOString(),
  };
}

/** Lê os eventos persistidos, descartando inválidos. Nunca lança. */
export function readAdMetrics(storageKey = AD_METRICS_STORAGE_KEY): AdMetricEvent[] {
  const events: AdMetricEvent[] = [];
  if (typeof window === "undefined") return events;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return events;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return events;
    for (const item of parsed) {
      const event = sanitizeAdMetricEvent(item);
      if (event) events.push(event);
    }
    return events;
  } catch {
    return events;
  }
}

/** Grava a lista completa. Falha de storage é silenciosa; nunca lança. */
export function writeAdMetrics(
  events: AdMetricEvent[],
  storageKey = AD_METRICS_STORAGE_KEY,
): boolean {
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
    return true;
  } catch {
    return false;
  }
}

/**
 * Acrescenta um evento ao histórico, aplicando o limite e mantendo os
 * eventos mais recentes. Retorna true apenas se a persistência chegou
 * ao storage sem erro.
 */
export function appendAdMetricEvent(
  event: AdMetricEvent | null,
  storageKey = AD_METRICS_STORAGE_KEY,
  max = MAX_AD_METRIC_EVENTS,
): boolean {
  if (!event) return false;
  const safeMax = Number.isFinite(max) && max > 0 ? Math.floor(max) : MAX_AD_METRIC_EVENTS;
  const next = [...readAdMetrics(storageKey), event];
  const trimmed = next.length > safeMax ? next.slice(next.length - safeMax) : next;
  return writeAdMetrics(trimmed, storageKey);
}

/**
 * Registra uma métrica de anúncio. Retorna o evento válido criado
 * (ou null se a entrada for malformada). A falha de persistência não
 * derruba a UI: o evento simplesmente não é armazenado.
 */
export function recordAdMetric(
  input: AdMetricInput,
  options: {
    now?: Date;
    idGen?: AdEventIdGenerator;
    storageKey?: string;
    max?: number;
  } = {},
): AdMetricEvent | null {
  const now = options.now ?? new Date();
  const event = buildAdMetricEvent(input, now, options.idGen);
  if (!event) return null;
  appendAdMetricEvent(event, options.storageKey, options.max);
  return event;
}

export type AdMetricCounts = { impressions: number; clicks: number };

export type AdMetricSummary = AdMetricCounts & {
  byPlacement: Record<string, AdMetricCounts>;
  byAd: Record<string, AdMetricCounts>;
};

/** Agrega contagens por tipo, posicionamento e anúncio (futura dashboard). */
export function summarizeAdMetrics(events: readonly AdMetricEvent[]): AdMetricSummary {
  const summary: AdMetricSummary = {
    impressions: 0,
    clicks: 0,
    byPlacement: {},
    byAd: {},
  };
  for (const event of events) {
    const isClick = event.type === "click";
    if (isClick) summary.clicks += 1;
    else summary.impressions += 1;
    const placement = summary.byPlacement[event.placement] ?? { impressions: 0, clicks: 0 };
    if (isClick) placement.clicks += 1;
    else placement.impressions += 1;
    summary.byPlacement[event.placement] = placement;
    const ad = summary.byAd[event.ad] ?? { impressions: 0, clicks: 0 };
    if (isClick) ad.clicks += 1;
    else ad.impressions += 1;
    summary.byAd[event.ad] = ad;
  }
  return summary;
}

/**
 * Identidade de exposição usada pela deduplicação de impressões.
 * Combina posicionamento + anúncio + montagem: em um mesmo ciclo de
 * montagem o anúncio é contado uma única vez; uma nova montagem
 * (nova navegação para o posicionamento) é uma nova exposição legítima.
 */
export function buildExposureKey(placement: string, adId: string, mountId: string): string {
  return `${placement}:${adId}:${mountId}`;
}

/** Deduplicador por exposição (uma chave por ciclo/campo de exibição). */
export function createExposureRecorder(): { recordOnce(key: string): boolean } {
  const seen = new Set<string>();
  return {
    recordOnce(key) {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
  };
}