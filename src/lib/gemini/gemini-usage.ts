import {
  GEMINI_CACHE_MAX_ENTRIES,
  GEMINI_CACHE_TTL_MS,
  GEMINI_RATE_LIMIT_PER_MINUTE,
  GEMINI_RATE_WINDOW_MS,
} from "./gemini-config";
import { GeminiError, GeminiErrorCode } from "./gemini-errors";

type Clock = () => number;

let rateBuckets = new Map<string, number[]>();
let cacheStore = new Map<string, { expiresAt: number; value: string }>();

export function resetGeminiUsageForTests(): void {
  rateBuckets = new Map();
  cacheStore = new Map();
}

export function usageKey(feature: string, actorId: string): string {
  const actor = actorId.trim() || "anonymous";
  return `${feature}:${actor}`;
}

export function cacheKey(feature: string, payload: unknown): string {
  return `${feature}:${JSON.stringify(payload)}`;
}

export function assertGeminiRateLimit(
  key: string,
  now: Clock = Date.now,
  limit = GEMINI_RATE_LIMIT_PER_MINUTE,
  windowMs = GEMINI_RATE_WINDOW_MS,
): void {
  const current = now();
  const cutoff = current - windowMs;
  const next = (rateBuckets.get(key) ?? []).filter((stamp) => stamp > cutoff);
  if (next.length >= limit) throw new GeminiError(GeminiErrorCode.RATE_LIMIT);
  next.push(current);
  rateBuckets.set(key, next);
}

export function readGeminiCache(key: string, now: Clock = Date.now): string | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function writeGeminiCache(
  key: string,
  value: string,
  now: Clock = Date.now,
  ttlMs = GEMINI_CACHE_TTL_MS,
): void {
  if (cacheStore.size >= GEMINI_CACHE_MAX_ENTRIES) {
    const oldest = cacheStore.keys().next().value;
    if (oldest) cacheStore.delete(oldest);
  }
  cacheStore.set(key, { value, expiresAt: now() + ttlMs });
}
