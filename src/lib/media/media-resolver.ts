import type { CanonicalMediaObject, MediaRef } from "./media-contract";

/**
 * D-M4 — resolvedor cliente. Somente consumidor: a decisao de autorizacao e a
 * assinatura ocorrem no servidor. Nenhuma URL assinada/token e registrada em log.
 *
 * Estados explicitos: `ready`, `legacy`, `local`, `forbidden`, `missing`, `unavailable`.
 *
 * Tres identidades distintas, que NAO podem substituir umas as outras:
 *  - identidade de cache: `authorizationScope` + `(bucket,path)`;
 *  - identidade de midia: `(bucket,path)`;
 *  - autorizacao: decidida por requisicao no servidor (`createMediaUrlService`).
 * O cache embute a autorizacao capturada no momento da assinatura; ele nao a
 * revalida. Invalide-o nos eventos documentados em `invalidateAll`/`invalidateScope`.
 */

export type MediaResolution =
  | { status: "ready"; url: string; expiresAt: number }
  | { status: "legacy"; url: string }
  | { status: "local"; mediaId: string; url?: string }
  | { status: "forbidden" }
  | { status: "missing" }
  | { status: "unavailable" };

export type MediaSignResult =
  | { status: "ready"; url: string; expiresIn: number }
  | { status: "forbidden" }
  | { status: "missing" }
  | { status: "unavailable" };

export type MediaCacheEntry =
  | { negative: false; url: string; expiresAt: number }
  | { negative: true; status: "forbidden" | "missing" | "unavailable"; expiresAt: number };

export type MediaCache = Map<string, MediaCacheEntry>;

export type MediaResolverDeps = {
  /** Assina no servidor (injentado). Nunca expor credencial privilegiada aqui. */
  sign: (object: CanonicalMediaObject) => Promise<MediaSignResult>;
  /**
   * R1 — OBRIGATORIO. Escopo de autorizacao derivado da sessao autenticada e
   * validada NO SERVIDOR (ex.: viewerId estavel). NUNCA aceite um valor vindo do
   * usuario final como prova de identidade. Escopo vazio/ausente/invalido e
   * rejeitado: sem escopo nao existe cache seguro e isolado.
   */
  authorizationScope: string;
  now?: () => number;
  /** Segundos de folga antes do vencimento (default 30). */
  clockSkewSeconds?: number;
  /** TTL curto para resultados negativos (default 5s). Nunca tratar como permanente. */
  negativeTtlSeconds?: number;
  /** Maximo de entradas no cache; eviccao FIFO determinística (default 128). */
  maxCacheEntries?: number;
  /** Resolve uma URL local (OPFS/demo). Opcional. */
  getLocalUrl?: (mediaId: string) => string | null | undefined | Promise<string | null | undefined>;
  /** Cache compartilhavel entre resolvers; a geracao e rastreada por instancia de Map. */
  cache?: MediaCache;
};

export type MediaResolver = {
  resolve: (ref: MediaRef) => Promise<MediaResolution>;
  resolveMany: (refs: MediaRef[]) => Promise<MediaResolution[]>;
  /** Invalida a midia `(bucket,path)` no escopo deste resolvedor (positivos e negativos). */
  invalidateMedia: (bucket: string, path: string) => void;
  /** Invalida todas as entradas de um escopo (default: o escopo deste resolvedor). */
  invalidateScope: (scope?: string) => void;
  /** Invalida todo o cache e a geracao (in-flight antigo nao repovoa). */
  invalidateAll: () => void;
  /** Alias de `invalidateAll`. */
  clearCache: () => void;
};

const DEFAULT_SKEW_SECONDS = 30;
const DEFAULT_NEGATIVE_TTL_SECONDS = 5;
const DEFAULT_MAX_CACHE_ENTRIES = 128;

/** Erro para escopo de autorizacao ausente/invalido. */
export class MediaResolverScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaResolverScopeError";
  }
}

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Escopo precisa ser string nao vazia, sem caracteres de controle. */
export function requireAuthorizationScope(scope: unknown): string {
  if (typeof scope !== "string") {
    throw new MediaResolverScopeError("authorizationScope must be a string");
  }
  const value = scope.trim();
  if (value === "") {
    throw new MediaResolverScopeError("authorizationScope must not be empty");
  }
  if (hasControlChar(value)) {
    throw new MediaResolverScopeError("authorizationScope must not contain control characters");
  }
  return value;
}

/** Geracao compartilhada por instancia de cache (mesmo Map => mesma geracao). */
type CacheMeta = { generation: number };
const cacheMeta = new WeakMap<object, CacheMeta>();

function metaFor(cache: MediaCache): CacheMeta {
  let meta = cacheMeta.get(cache);
  if (!meta) {
    meta = { generation: 0 };
    cacheMeta.set(cache, meta);
  }
  return meta;
}

export function createMediaResolver(deps: MediaResolverDeps): MediaResolver {
  const now = deps.now ?? (() => Date.now());
  const skewMs = (deps.clockSkewSeconds ?? DEFAULT_SKEW_SECONDS) * 1000;
  const negativeTtlMs = (deps.negativeTtlSeconds ?? DEFAULT_NEGATIVE_TTL_SECONDS) * 1000;
  const maxEntries = Math.max(1, deps.maxCacheEntries ?? DEFAULT_MAX_CACHE_ENTRIES);
  const scope = requireAuthorizationScope(deps.authorizationScope);
  const cache = deps.cache ?? new Map<string, MediaCacheEntry>();
  const meta = metaFor(cache);
  const inflight = new Map<string, Promise<MediaResolution>>();

  function cacheKey(object: CanonicalMediaObject): string {
    return `${scope}\u0000${object.bucket}/${object.path}`;
  }

  function setCache(key: string, entry: MediaCacheEntry): void {
    cache.set(key, entry);
    while (cache.size > maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }

  async function resolveValid(object: CanonicalMediaObject): Promise<MediaResolution> {
    const key = cacheKey(object);
    const cached = cache.get(key);
    if (cached) {
      // Positivos usam skew; negativos usam TTL curto sem skew.
      const fresh = cached.negative ? now() < cached.expiresAt : now() < cached.expiresAt - skewMs;
      if (fresh) {
        if (cached.negative) return { status: cached.status };
        return { status: "ready", url: cached.url, expiresAt: cached.expiresAt };
      }
      cache.delete(key);
    }

    const pending = inflight.get(key);
    if (pending) return pending;

    // R5: captura a geracao; se invalidada durante o await, NAO repovoa o cache.
    const startGeneration = meta.generation;
    const promise = (async (): Promise<MediaResolution> => {
      let result: MediaSignResult;
      try {
        result = await deps.sign(object);
      } catch {
        if (meta.generation === startGeneration) {
          setCache(key, {
            negative: true,
            status: "unavailable",
            expiresAt: now() + negativeTtlMs,
          });
        }
        return { status: "unavailable" };
      }
      if (result.status === "ready") {
        const expiresAt = now() + result.expiresIn * 1000;
        if (meta.generation === startGeneration) {
          setCache(key, { negative: false, url: result.url, expiresAt });
        }
        return { status: "ready", url: result.url, expiresAt };
      }
      if (meta.generation === startGeneration) {
        setCache(key, { negative: true, status: result.status, expiresAt: now() + negativeTtlMs });
      }
      return { status: result.status };
    })();

    inflight.set(key, promise);
    try {
      return await promise;
    } finally {
      if (inflight.get(key) === promise) inflight.delete(key);
    }
  }

  async function resolve(ref: MediaRef): Promise<MediaResolution> {
    switch (ref.state) {
      case "valid":
        return resolveValid(ref.object);
      case "legacy-public":
      case "legacy-signed":
        return { status: "legacy", url: ref.url };
      case "local": {
        if (deps.getLocalUrl && ref.mediaId) {
          try {
            const url = await deps.getLocalUrl(ref.mediaId);
            if (url) return { status: "local", mediaId: ref.mediaId, url };
          } catch {
            /* cai para local sem url */
          }
        }
        return { status: "local", mediaId: ref.mediaId };
      }
      case "invalid":
        // Referencia nao reconhecida NUNCA recebe acesso privilegiado.
        return { status: "forbidden" };
    }
  }

  function invalidateMedia(bucket: string, path: string): void {
    cache.delete(`${scope}\u0000${bucket}/${path}`);
    meta.generation += 1;
    inflight.clear();
  }

  function invalidateScope(targetScope?: string): void {
    const target = requireAuthorizationScope(targetScope ?? scope);
    const prefix = `${target}\u0000`;
    for (const key of [...cache.keys()]) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
    meta.generation += 1;
    inflight.clear();
  }

  function invalidateAll(): void {
    cache.clear();
    meta.generation += 1;
    inflight.clear();
  }

  return {
    resolve,
    resolveMany(refs: MediaRef[]): Promise<MediaResolution[]> {
      return Promise.all(refs.map((ref) => resolve(ref)));
    },
    invalidateMedia,
    invalidateScope,
    invalidateAll,
    clearCache: invalidateAll,
  };
}

/** Redige uma URL de midia para log (remove query/token). Nunca logar a URL crua. */
export function redactMediaUrlForLog(url: string): string {
  const queryIndex = url.indexOf("?");
  return queryIndex === -1 ? url : `${url.slice(0, queryIndex)}?[REDACTED]`;
}
