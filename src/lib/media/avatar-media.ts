import { getTrustedStorageOrigin, parseStorageUrl, validateMediaPath } from "./media-path";

/**
 * G4.21 — classificacao/resolucao de referencia de avatar (100% offline).
 *
 * Escopo: dado o valor escalar persistido em `profiles.photo_url` (ou usado como
 * avatar em demo), classificar a referencia e devolver uma URL segura para
 * renderizacao IMEDIATA. Este modulo NAO assina, NAO faz rede, NAO decide
 * autorizacao remota e NAO grava em cache.
 *
 * Regras do contrato:
 *  - Bucket permitido: apenas `avatars`. URL publica/assinada de outro bucket e
 *    rejeitada (nao presumir autorizacao).
 *  - Reutiliza `parseStorageUrl`/`validateMediaPath` (nao duplica parsing).
 *  - Uma URL publica NAO e tratada como "privada" nem como "autorizada".
 *  - Uma URL assinada (legado) e apenas repassada para render; NAO e convertida
 *    em URL publica e sua expiracao NAO e avaliada localmente.
 *  - Caminho canonico `{ownerId}/...` exige o bucket implicito `avatars`; nao
 *    recebe URL hoje (a assinatura de avatar depende de decisao de privacidade
 *    ainda pendente), portanto `resolveAvatarDisplayUrl` devolve `null` e o
 *    consumidor usa o fallback local (iniciais).
 *  - Se `expectedOwnerId` for informado, referencias cujo dono difira sao
 *    rejeitadas (nao tratar caminho de um usuario como de outro).
 */

export const AVATAR_BUCKET = "avatars" as const;

export type AvatarBucket = typeof AVATAR_BUCKET;

export type AvatarRejectReason =
  | "not-string"
  | "non-http-protocol"
  | "storage-foreign-bucket"
  | "storage-bad-path"
  | "foreign-owner"
  | "invalid-path"
  | "unrecognized";

export type AvatarRef =
  | { kind: "missing" }
  | { kind: "local"; url: string }
  | { kind: "external"; url: string }
  | { kind: "storage-public"; bucket: AvatarBucket; path: string; url: string }
  | { kind: "storage-signed"; bucket: AvatarBucket; path: string; url: string }
  | { kind: "canonical"; bucket: AvatarBucket; path: string; ownerId: string }
  | { kind: "rejected"; reason: AvatarRejectReason };

export type ClassifyAvatarOptions = {
  /** Origem confiavel de Storage. Default: `getTrustedStorageOrigin()`. */
  trustedOrigin?: string | null;
  /** Se informado, referencias de Storage com dono diferente sao rejeitadas. */
  expectedOwnerId?: string | null;
};

const HTTPS_URL_RE = /^https?:\/\//i;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

function isLocalMediaUrl(value: string): boolean {
  return value.startsWith("data:") || value.startsWith("blob:");
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.hostname ? url : null;
  } catch {
    return null;
  }
}

function resolveOrigin(options: ClassifyAvatarOptions): string | null {
  return options.trustedOrigin === undefined ? getTrustedStorageOrigin() : options.trustedOrigin;
}

function ownerMatches(path: string, expectedOwnerId: string | null | undefined): boolean {
  if (!expectedOwnerId) return true;
  const validation = validateMediaPath(path);
  return validation.ok && validation.ownerId === expectedOwnerId;
}

/** Classifica um valor bruto de avatar em um `AvatarRef`. Puro e fail-closed. */
export function classifyAvatarRef(value: unknown, options: ClassifyAvatarOptions = {}): AvatarRef {
  if (value === null || value === undefined) return { kind: "missing" };
  if (typeof value !== "string") return { kind: "rejected", reason: "not-string" };
  const raw = value.trim();
  if (raw === "") return { kind: "missing" };

  if (isLocalMediaUrl(raw)) return { kind: "local", url: raw };

  if (HTTPS_URL_RE.test(raw)) {
    const url = parseHttpUrl(raw);
    if (!url) return { kind: "rejected", reason: "unrecognized" };
    const parsed = parseStorageUrl(raw, options.trustedOrigin);
    if (!parsed) {
      const origin = resolveOrigin(options);
      // URL malformada no proprio dominio de Storage: fail-closed.
      if (origin && url.origin === origin) return { kind: "rejected", reason: "unrecognized" };
      // Origem nao confiavel: URL HTTP(S) externa (ex.: mocks/demo). Sem acesso privilegiado.
      return { kind: "external", url: raw };
    }
    if (parsed.bucket !== AVATAR_BUCKET) {
      return { kind: "rejected", reason: "storage-foreign-bucket" };
    }
    if (!ownerMatches(parsed.path, options.expectedOwnerId)) {
      return { kind: "rejected", reason: "foreign-owner" };
    }
    return parsed.visibility === "public"
      ? { kind: "storage-public", bucket: AVATAR_BUCKET, path: parsed.path, url: raw }
      : { kind: "storage-signed", bucket: AVATAR_BUCKET, path: parsed.path, url: raw };
  }

  if (SCHEME_RE.test(raw)) return { kind: "rejected", reason: "non-http-protocol" };

  const validation = validateMediaPath(raw);
  if (!validation.ok) return { kind: "rejected", reason: "invalid-path" };
  if (!ownerMatches(raw, options.expectedOwnerId)) {
    return { kind: "rejected", reason: "foreign-owner" };
  }
  return { kind: "canonical", bucket: AVATAR_BUCKET, path: raw, ownerId: validation.ownerId };
}

/**
 * URL pronta para `<img src>` quando derivavel com seguranca hoje.
 *
 * - `local`/`external`/`storage-public`/`storage-signed` => a propria URL.
 * - `canonical` => `null` (depende de assinatura de avatar ainda nao definida).
 * - `missing`/`rejected` => `null` (consumidor usa fallback local).
 *
 * Preserva o comportamento atual dos consumidores para os formatos ja
 * persistidos (URL publica, URL assinada legada, externa e local).
 */
export function resolveAvatarDisplayUrl(
  value: unknown,
  options: ClassifyAvatarOptions = {},
): string | null {
  const ref = classifyAvatarRef(value, options);
  switch (ref.kind) {
    case "local":
    case "external":
    case "storage-public":
    case "storage-signed":
      return ref.url;
    case "canonical":
    case "missing":
    case "rejected":
      return null;
  }
}
