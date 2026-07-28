/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — Cache
   Central cache with configurable TTL.
   Pure TypeScript. No React. No side effects.
========================================================== */

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  module: string;
  createdAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalModules: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  entriesByModule: Record<string, number>;
}

interface CacheState {
  entries: Map<string, CacheEntry>;
  hits: number;
  misses: number;
}

const cacheState: CacheState = {
  entries: new Map(),
  hits: 0,
  misses: 0,
};

/* ─── Core ────────────────────────────────────────────────── */

export function getCache<T = unknown>(key: string): T | null {
  const entry = cacheState.entries.get(key);
  if (!entry) {
    cacheState.misses++;
    return null;
  }

  const now = Date.now();
  if (now - entry.createdAt > entry.ttl) {
    cacheState.entries.delete(key);
    cacheState.misses++;
    return null;
  }

  entry.accessCount++;
  entry.lastAccessed = now;
  cacheState.hits++;
  return entry.value as T;
}

export function setCache<T = unknown>(
  key: string,
  value: T,
  module: string,
  ttlMs: number = 5 * 60 * 1000,
): void {
  const now = Date.now();
  cacheState.entries.set(key, {
    key,
    value,
    module,
    createdAt: now,
    ttl: ttlMs,
    accessCount: 0,
    lastAccessed: now,
  });
}

export function invalidateCache(key: string): boolean {
  return cacheState.entries.delete(key);
}

export function clearCache(): void {
  cacheState.entries.clear();
  cacheState.hits = 0;
  cacheState.misses = 0;
}

export function invalidateByModule(module: string): number {
  let count = 0;
  for (const [key, entry] of cacheState.entries) {
    if (entry.module === module) {
      cacheState.entries.delete(key);
      count++;
    }
  }
  return count;
}

export function hasCache(key: string): boolean {
  const entry = cacheState.entries.get(key);
  if (!entry) return false;
  if (Date.now() - entry.createdAt > entry.ttl) {
    cacheState.entries.delete(key);
    return false;
  }
  return true;
}

export function getCacheStats(): CacheStats {
  const entriesByModule: Record<string, number> = {};
  for (const entry of cacheState.entries.values()) {
    entriesByModule[entry.module] = (entriesByModule[entry.module] ?? 0) + 1;
  }

  const totalHits = cacheState.hits;
  const totalMisses = cacheState.misses;
  const hitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

  return {
    totalEntries: cacheState.entries.size,
    totalModules: Object.keys(entriesByModule).length,
    hitRate,
    totalHits,
    totalMisses,
    entriesByModule,
  };
}

export function cleanupExpiredCache(): number {
  const now = Date.now();
  let count = 0;
  for (const [key, entry] of cacheState.entries) {
    if (now - entry.createdAt > entry.ttl) {
      cacheState.entries.delete(key);
      count++;
    }
  }
  return count;
}

export function generateCacheKey(module: string, action: string, params?: string): string {
  return params ? `connexy:${module}:${action}:${params}` : `connexy:${module}:${action}`;
}
