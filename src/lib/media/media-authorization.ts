import {
  bucketSupportsKind,
  classifyMediaValue,
  findMediaItem,
  normalizePostMedia,
  type CanonicalMediaObject,
  type PostMediaItem,
} from "./media-contract";
import { validateMediaPath } from "./media-path";
import type { MediaSignResult } from "./media-resolver";

/**
 * D-M3/D-M4 — nucleo de autorizacao server-side.
 *
 * Regra: carregar a publicacao da fonte confiavel (RLS) e aplicar a autorizacao
 * antes de assinar. Nunca confiar em bucket/path do cliente como prova. A
 * identidade solicitada precisa EXISTIR na midia registrada da publicacao
 * autorizada. Nao importar cliente, service role ou UI. A assinatura (`sign`) e
 * injetada.
 */

export type PostPrivacyValue = "PUBLIC" | "CONNECTIONS" | "PRIVATE";

export type AuthorizablePost = {
  id: string;
  author_id: string;
  privacy: string;
  media: unknown;
};

/**
 * M1 — identidade estavel. Preferir `identity` (bucket + caminho relativo).
 * `index` e aceito apenas sobre a MESMA normalizacao do servidor (`normalizePostMedia`).
 */
export type MediaLocator =
  | { kind: "identity"; bucket: string; path: string }
  | { kind: "index"; index: number };

export const MEDIA_URL_TTL_DEFAULT_SECONDS = 300;
export const MEDIA_URL_TTL_MIN_SECONDS = 60;
export const MEDIA_URL_TTL_MAX_SECONDS = 300;

/** Trata ausentes, nao numericos, infinitos e fora do intervalo. */
export function clampMediaUrlTtl(seconds: number | undefined | null): number {
  if (seconds === undefined || seconds === null) return MEDIA_URL_TTL_DEFAULT_SECONDS;
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return MEDIA_URL_TTL_DEFAULT_SECONDS;
  }
  return Math.min(
    MEDIA_URL_TTL_MAX_SECONDS,
    Math.max(MEDIA_URL_TTL_MIN_SECONDS, Math.floor(seconds)),
  );
}

/** Espelha `posts_select_privacy` (PUBLIC | autor | CONNECTIONS via are_connected). */
export function canViewPost(input: {
  privacy: string;
  authorId: string;
  viewerId: string | null;
  areConnected: boolean;
}): boolean {
  if (!input.viewerId) return false;
  if (input.privacy === "PUBLIC") return true;
  if (input.authorId === input.viewerId) return true;
  if (input.privacy === "CONNECTIONS") return input.areConnected;
  return false;
}

export type MediaAccessDecision =
  | { allowed: true; object: CanonicalMediaObject }
  | { allowed: false; reason: "not-found" | "forbidden" | "invalid-ref" | "missing-media" };

/**
 * Deriva a midia da LINHA autorizada (nao do request) e autoriza.
 * A identidade/index do cliente e apenas um localizador; a prova e o item
 * registrado em `post.media`, com dono e bucket/tipo revalidados.
 */
export function authorizeMediaAccess(input: {
  post: AuthorizablePost | null;
  locator: MediaLocator;
  viewerId: string | null;
  areConnected: boolean;
}): MediaAccessDecision {
  const { post, locator } = input;
  if (!post) return { allowed: false, reason: "not-found" };
  if (
    !canViewPost({
      privacy: post.privacy,
      authorId: post.author_id,
      viewerId: input.viewerId,
      areConnected: input.areConnected,
    })
  ) {
    return { allowed: false, reason: "forbidden" };
  }

  const items = normalizePostMedia(post.media);
  let item: PostMediaItem | null | undefined;
  if (locator.kind === "identity") {
    if (typeof locator.bucket !== "string" || typeof locator.path !== "string") {
      return { allowed: false, reason: "invalid-ref" };
    }
    item = findMediaItem(items, locator.bucket, locator.path);
  } else {
    if (!Number.isInteger(locator.index) || locator.index < 0) {
      return { allowed: false, reason: "invalid-ref" };
    }
    item = items[locator.index];
  }
  if (!item) return { allowed: false, reason: "missing-media" };

  const ref = classifyMediaValue(item);
  if (ref.state !== "valid") return { allowed: false, reason: "invalid-ref" };

  // L4: bucket precisa ser compativel com o tipo declarado.
  if (!bucketSupportsKind(ref.object.bucket, ref.object.kind)) {
    return { allowed: false, reason: "invalid-ref" };
  }

  const pathValidation = validateMediaPath(ref.object.path);
  if (!pathValidation.ok || pathValidation.ownerId !== post.author_id) {
    return { allowed: false, reason: "invalid-ref" };
  }
  return { allowed: true, object: ref.object };
}

export type MediaUrlResult =
  | { status: "ready"; url: string; expiresAt: number }
  | { status: "forbidden" }
  | { status: "missing" }
  | { status: "unavailable" };

export type MediaUrlServiceDeps = {
  isEnabled: () => boolean;
  getViewerId: () => Promise<string | null>;
  loadPost: (postId: string) => Promise<AuthorizablePost | null>;
  areConnected: (viewerId: string, authorId: string) => Promise<boolean>;
  /** Recebe o TTL efetivamente limitado (60–300s) pelo servico. */
  sign: (object: CanonicalMediaObject, ttlSeconds: number) => Promise<MediaSignResult>;
  now?: () => number;
  ttlSeconds?: number;
};

export type MediaUrlService = {
  getMediaUrl: (postId: string, locator: MediaLocator) => Promise<MediaUrlResult>;
};

/** Servidor: autoriza a partir da linha e assina com TTL limitado. Nunca loga a URL. */
export function createMediaUrlService(deps: MediaUrlServiceDeps): MediaUrlService {
  const now = deps.now ?? (() => Date.now());
  const ttlSeconds = clampMediaUrlTtl(deps.ttlSeconds);

  return {
    async getMediaUrl(postId: string, locator: MediaLocator): Promise<MediaUrlResult> {
      if (!deps.isEnabled()) return { status: "unavailable" };

      const viewerId = await deps.getViewerId();
      if (!viewerId) return { status: "forbidden" };

      let post: AuthorizablePost | null;
      try {
        post = await deps.loadPost(postId);
      } catch {
        return { status: "unavailable" };
      }
      // Nao revelar existencia: publicacao inexistente e nao autorizada sao iguais.
      if (!post) return { status: "forbidden" };

      let areConnected = false;
      if (post.privacy === "CONNECTIONS" && post.author_id !== viewerId) {
        try {
          areConnected = await deps.areConnected(viewerId, post.author_id);
        } catch {
          return { status: "unavailable" };
        }
      }

      const decision = authorizeMediaAccess({ post, locator, viewerId, areConnected });
      if (!decision.allowed) {
        if (decision.reason === "missing-media") return { status: "missing" };
        return { status: "forbidden" };
      }

      let signed: MediaSignResult;
      try {
        signed = await deps.sign(decision.object, ttlSeconds);
      } catch {
        return { status: "unavailable" };
      }
      if (signed.status === "ready") {
        // Nao afirmar validade alem do TTL solicitado: capa pelo TTL do servico.
        const effectiveTtl = Math.min(signed.expiresIn, ttlSeconds);
        return { status: "ready", url: signed.url, expiresAt: now() + effectiveTtl * 1000 };
      }
      return { status: signed.status };
    },
  };
}
