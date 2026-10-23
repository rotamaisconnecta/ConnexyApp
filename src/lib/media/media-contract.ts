import {
  isMediaBucket,
  MEDIA_KINDS_BY_BUCKET,
  parseStorageUrl,
  validateMediaPath,
  type MediaBucket,
} from "./media-path";

/**
 * D-M1 — contrato canonico de midia.
 *
 * Identidade primaria = `(bucket, path)`. Uma URL nunca e identidade.
 * `preview` e `mediaId` sao legado/demo e NUNCA concedem acesso privilegiado.
 * Itens sem `preview` mas com `(bucket, path)` valido NAO devem ser descartados.
 * Este modulo e puro: nao importa cliente Supabase, service role, demo ou UI.
 */

export type MediaKind = "image" | "video";

export function isMediaKind(value: unknown): value is MediaKind {
  return value === "image" || value === "video";
}

export type CanonicalMediaObject = {
  bucket: MediaBucket;
  path: string;
  kind: MediaKind;
  posterPath?: string;
};

export type MediaRef =
  | { state: "valid"; object: CanonicalMediaObject }
  | { state: "legacy-public"; bucket?: string; path?: string; url: string; kind: MediaKind }
  | { state: "legacy-signed"; bucket?: string; path?: string; url: string; kind: MediaKind }
  | { state: "local"; mediaId: string; kind: MediaKind; preview?: string }
  | { state: "invalid"; reason: string };

/** Item normalizado de `posts.media`. Campos de identidade sao opcionais. */
export type PostMediaItem = {
  type: MediaKind;
  bucket?: string;
  path?: string;
  posterPath?: string;
  preview?: string;
  mediaId?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

export type ClassifyMediaOptions = {
  /** Origem confiavel de Storage. Default: config do projeto. */
  trustedOrigin?: string | null;
};

/**
 * Classifica um valor bruto em uma `MediaRef`.
 * Ordem: identidade canonica `(bucket,path)` > URL de Storage (origem confiavel)
 * > preview local > mediaId > invalido. Uma URL HTTP(S) no campo `path` e invalida.
 */
export function classifyMediaValue(value: unknown, options: ClassifyMediaOptions = {}): MediaRef {
  const record = asRecord(value);
  if (!record) return { state: "invalid", reason: "not-object" };
  if (!isMediaKind(record.type)) return { state: "invalid", reason: "bad-kind" };
  const kind = record.type;

  const bucketValue = record.bucket;
  const pathValue = record.path;
  const hasBucket = typeof bucketValue === "string" && isMediaBucket(bucketValue);
  const pathValidation = validateMediaPath(pathValue);

  if (hasBucket && pathValidation.ok) {
    const posterPath =
      typeof record.posterPath === "string" && validateMediaPath(record.posterPath).ok
        ? record.posterPath
        : undefined;
    return {
      state: "valid",
      object: {
        bucket: bucketValue as MediaBucket,
        path: pathValue as string,
        kind,
        ...(posterPath ? { posterPath } : {}),
      },
    };
  }

  const preview = typeof record.preview === "string" ? record.preview : undefined;

  if (preview && isHttpUrl(preview)) {
    const parsed = parseStorageUrl(preview, options.trustedOrigin);
    if (parsed) {
      return {
        state: parsed.visibility === "public" ? "legacy-public" : "legacy-signed",
        bucket: parsed.bucket,
        path: parsed.path,
        url: preview,
        kind,
      };
    }
    return { state: "invalid", reason: "external-url" };
  }

  // L5: URL HTTP(S) nunca e caminho canonico. So `preview` pode ser URL legada.
  if (isHttpUrl(String(pathValue ?? ""))) {
    return { state: "invalid", reason: "url-in-path" };
  }

  if (preview && isDataUrl(preview)) {
    return { state: "local", mediaId: "", kind, preview };
  }

  if (typeof record.mediaId === "string" && record.mediaId.length > 0) {
    return { state: "local", mediaId: record.mediaId, kind, ...(preview ? { preview } : {}) };
  }
  if (preview !== undefined) {
    return { state: "local", mediaId: "", kind, preview };
  }

  return { state: "invalid", reason: "no-identity" };
}

/**
 * Normaliza `posts.media` (jsonb) preservando itens validos, legado e locais.
 * Itens sem `preview` mas com `(bucket,path)` valido sao MANTIDOS (D-M1).
 */
export function normalizePostMedia(value: unknown): PostMediaItem[] {
  if (!Array.isArray(value)) return [];
  const items: PostMediaItem[] = [];
  for (const raw of value) {
    const record = asRecord(raw);
    if (!record || !isMediaKind(record.type)) continue;
    const kind = record.type;

    const bucket = typeof record.bucket === "string" ? record.bucket : undefined;
    const path = typeof record.path === "string" ? record.path : undefined;
    const preview = typeof record.preview === "string" ? record.preview : undefined;
    const mediaId =
      typeof record.mediaId === "string" && record.mediaId ? record.mediaId : undefined;
    const posterPath =
      typeof record.posterPath === "string" && validateMediaPath(record.posterPath).ok
        ? record.posterPath
        : undefined;

    const hasCanonical =
      bucket !== undefined && isMediaBucket(bucket) && validateMediaPath(path).ok;
    const isLegacyUrl = preview !== undefined && isHttpUrl(preview);
    const isLocal = preview !== undefined || mediaId !== undefined;

    if (!hasCanonical && !isLegacyUrl && !isLocal) continue;

    const item: PostMediaItem = { type: kind };
    if (hasCanonical) {
      item.bucket = bucket;
      item.path = path;
      if (posterPath) item.posterPath = posterPath;
    }
    if (preview !== undefined) item.preview = preview;
    if (mediaId !== undefined) item.mediaId = mediaId;
    items.push(item);
  }
  return items;
}

/**
 * Normaliza e classifica `posts.media` com a MESMA normalizacao que o servidor
 * usa em `authorizeMediaAccess`, para que cliente e servidor compartilhem a
 * posicao/identidade dos itens. Retorna as refs na mesma ordem do array normalizado.
 */
export function classifyPostMedia(value: unknown, options: ClassifyMediaOptions = {}): MediaRef[] {
  return normalizePostMedia(value).map((item) => classifyMediaValue(item, options));
}

/** Localiza um item normalizado por identidade estavel `(bucket,path)`. */
export function findMediaItem(
  items: readonly PostMediaItem[],
  bucket: string,
  path: string,
): PostMediaItem | null {
  return items.find((item) => item.bucket === bucket && item.path === path) ?? null;
}

/** Serializa um item normalizado de volta para jsonb, omitindo campos indefinidos. */
export function serializePostMediaItem(item: PostMediaItem): Record<string, unknown> {
  const out: Record<string, unknown> = { type: item.type };
  if (item.bucket !== undefined && item.path !== undefined) {
    out.bucket = item.bucket;
    out.path = item.path;
  }
  if (item.posterPath !== undefined) out.posterPath = item.posterPath;
  if (item.preview !== undefined) out.preview = item.preview;
  if (item.mediaId !== undefined) out.mediaId = item.mediaId;
  return out;
}

/** Conveniencia: bucket pelo proposito do Schema A, sem criar buckets novos. */
export function bucketForKind(kind: MediaKind): MediaBucket {
  return kind === "video" ? "reels-media" : "bio-media";
}

export function bucketSupportsKind(bucket: MediaBucket, kind: MediaKind): boolean {
  return (MEDIA_KINDS_BY_BUCKET[bucket] as readonly MediaKind[]).includes(kind);
}
