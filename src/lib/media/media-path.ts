import { isSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import { ownerIdFromStoragePath } from "@/lib/storage/schema-a-storage";

/**
 * D-M2 — path canonico de midia.
 *
 * Formato: `{ownerId}/{objectId}.{ext}` (ownerId = auth.uid() do autor).
 * O primeiro segmento DEVE ser um UUID. Nenhuma funcao aqui confia em
 * bucket/path fornecidos pelo cliente como fonte de autorizacao.
 */

export const MEDIA_KINDS_BY_BUCKET = {
  avatars: ["image"],
  "bio-media": ["image", "video"],
  "reels-media": ["image", "video"],
} as const;

export type MediaBucket = keyof typeof MEDIA_KINDS_BY_BUCKET;

export function isMediaBucket(value: string): value is MediaBucket {
  return Object.prototype.hasOwnProperty.call(MEDIA_KINDS_BY_BUCKET, value);
}

const EXTENSION_RE = /^[a-z0-9]{1,8}$/;
const ENCODED_OCTET_RE = /%[0-9a-f]{2}/i;

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export type MediaPathRejectReason =
  | "empty"
  | "not-string"
  | "absolute"
  | "traversal"
  | "backslash"
  | "empty-segment"
  | "encoded"
  | "control"
  | "no-owner"
  | "no-extension"
  | "bad-extension";

export type MediaPathValidation =
  | { ok: true; ownerId: string; extension: string }
  | { ok: false; reason: MediaPathRejectReason };

/**
 * Valida um path RELATIVO de objeto, ja decodificado. Rejeita caminho absoluto,
 * `..`, `\`, segmento vazio, octal codificado (`%2e`), caracteres de controle,
 * sem UUID no primeiro segmento, sem extensao ou com extensao invalida.
 *
 * Nao decodifica. O chamador deve decodificar EXATAMENTE uma vez antes.
 */
export function validateMediaPath(path: unknown): MediaPathValidation {
  if (typeof path !== "string") return { ok: false, reason: "not-string" };
  const value = path.trim();
  if (value === "") return { ok: false, reason: "empty" };
  if (value.startsWith("/")) return { ok: false, reason: "absolute" };
  if (value.includes("..")) return { ok: false, reason: "traversal" };
  if (value.includes("\\")) return { ok: false, reason: "backslash" };
  if (hasControlChar(value)) return { ok: false, reason: "control" };
  if (ENCODED_OCTET_RE.test(value)) return { ok: false, reason: "encoded" };

  const segments = value.split("/");
  if (segments.some((segment) => segment === "")) {
    return { ok: false, reason: "empty-segment" };
  }

  const ownerId = ownerIdFromStoragePath(value);
  if (!ownerId || !isSchemaAUuid(ownerId)) return { ok: false, reason: "no-owner" };

  const segment = segments[segments.length - 1] ?? "";
  const dot = segment.lastIndexOf(".");
  if (dot <= 0 || dot === segment.length - 1) return { ok: false, reason: "no-extension" };

  const extension = segment.slice(dot + 1).toLowerCase();
  if (!EXTENSION_RE.test(extension)) return { ok: false, reason: "bad-extension" };

  return { ok: true, ownerId, extension };
}

/** Um path so e considerado de propriedade se o 1o segmento for o uid esperado. */
export function isOwnedMediaPath(path: string, ownerId: string): boolean {
  const validation = validateMediaPath(path);
  if (!validation.ok) return false;
  return validation.ownerId === ownerId;
}

export type ParsedStorageUrl = {
  bucket: string;
  path: string;
  visibility: "public" | "signed";
};

const PUBLIC_MARKER = "/storage/v1/object/public/";
const SIGN_MARKER = "/storage/v1/object/sign/";

/** Origem confiavel de Storage derivada da config do projeto (nunca dominio inventado). */
export function getTrustedStorageOrigin(): string | null {
  const raw = import.meta.env.VITE_APP_SUPABASE_URL;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/**
 * Extrai `{bucket, path}` de uma URL de Storage `/public/` ou `/sign/`.
 *
 * - So aceita a origem confiavel (config do projeto ou `trustedOrigin` explicito).
 * - Decodifica EXATAMENTE uma vez; falha de decodificacao => `null`.
 * - Valida o path decodificado com `validateMediaPath` (rejeita traversal,
 *   absoluto, segmentos vazios, octal codificado). URL invalida => `null`.
 * - O token (query) e descartado.
 */
export function parseStorageUrl(
  url: string,
  trustedOrigin?: string | null,
): ParsedStorageUrl | null {
  if (typeof url !== "string") return null;
  const origin = trustedOrigin === undefined ? getTrustedStorageOrigin() : trustedOrigin;
  if (!origin) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.origin !== origin) return null;

  const pathname = parsed.pathname;
  for (const [marker, visibility] of [
    [PUBLIC_MARKER, "public"],
    [SIGN_MARKER, "signed"],
  ] as const) {
    const idx = pathname.indexOf(marker);
    if (idx === -1) continue;
    const rest = pathname.slice(idx + marker.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const bucket = rest.slice(0, slash);

    let decoded: string;
    try {
      decoded = decodeURIComponent(rest.slice(slash + 1));
    } catch {
      return null;
    }
    if (!bucket || !decoded) return null;

    const validation = validateMediaPath(decoded);
    if (!validation.ok) return null;
    return { bucket, path: decoded, visibility };
  }
  return null;
}
