import {
  classifyMediaValue,
  type CanonicalMediaObject,
  type MediaRef,
  type PostMediaItem,
} from "./media-contract";
import {
  createMediaResolver,
  type MediaCache,
  type MediaResolution,
  type MediaResolver,
  type MediaSignResult,
} from "./media-resolver";
import { isMediaUrlSigningEnabled } from "./media-url-flag";

/**
 * G4.5 — fronteira de resolucao de midia de POSTS.
 *
 * Este modulo e puro (nao importa cliente Supabase, service role, demo ou UI).
 * Ele liga o anexo REAL de uma publicacao ao resolvedor cliente `media-resolver`,
 * reutilizando cache, escopo de autorizacao e TTL ja implementados. A assinatura
 * privilegiada e INJETADA: o unico consumidor de runtime do servidor e
 * `post-media-signer.ts`, que chama `getPostMediaUrl`.
 *
 * Regras de seguranca:
 *  - A identidade do anexo e `(bucket, path)` do item ja normalizado (contrato
 *    D-M1). `preview`/`mediaId` sao legado/demo e NUNCA concedem acesso.
 *  - Encaminhar ao servidor SOMENTE itens canonicos reconhecidos pelo contrato e
 *    quando a assinatura esta habilitada (flag + auth remoto). Fora disso, o
 *    caminho legado (local/preview) permanece intacto.
 *  - Quando o item e elegivel, uma falha de autorizacao/assinatura NAO cai para
 *    `preview`: o estado e fechado (nunca mídia privada como fallback publico).
 */

/**
 * Forma minima de um item de `posts.media` que esta fronteira entende. Reusa o
 * tipo normalizado do contrato D-M1, evitando divergencia entre cliente e servidor.
 */
export type PostMediaLike = PostMediaItem;

const POST_ID_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O servidor valida `postId` como UUID; ids locais/demo nunca sao encaminhados. */
export function isEligiblePostId(postId: unknown): postId is string {
  return typeof postId === "string" && POST_ID_UUID_RE.test(postId);
}

/** Classifica um item de post com a MESMA normalizacao/contrato do servidor. */
export function classifyPostMediaItem(media: PostMediaLike): MediaRef {
  return classifyMediaValue(media);
}

/** Um item so e canonico quando o contrato o reconhece como `(bucket, path)` valido. */
export function isCanonicalPostMedia(media: PostMediaLike): boolean {
  return classifyMediaValue(media).state === "valid";
}

/** Classifica a lista completa, preservando a ordem (mesma semantica do servidor). */
export function listPostMediaRefs(media: readonly PostMediaLike[]): MediaRef[] {
  return media.map((item) => classifyMediaValue(item));
}

/** Assinatura vinculada a uma publicacao (o servidor exige `postId` + localizador). */
export type PostMediaSign = (input: {
  postId: string;
  object: CanonicalMediaObject;
}) => Promise<MediaSignResult>;

export type PostMediaResolverDeps = {
  postId: string;
  /** Escopo de autorizacao = identidade do espectador validada. Nunca vazio. */
  authorizationScope: string;
  sign: PostMediaSign;
  cache?: MediaCache;
  now?: () => number;
  clockSkewSeconds?: number;
  negativeTtlSeconds?: number;
  maxCacheEntries?: number;
  getLocalUrl?: (mediaId: string) => string | null | undefined | Promise<string | null | undefined>;
};

/**
 * Cria um resolvedor de midia de post vinculado a um `postId`. Toda a
 * seguranca de cache/escopo/TTL vem de `createMediaResolver`; aqui apenas
 * amarramos o `sign` a publicacao para respeitar o contrato de `getPostMediaUrl`.
 */
export function createPostMediaResolver(deps: PostMediaResolverDeps): MediaResolver {
  return createMediaResolver({
    authorizationScope: deps.authorizationScope,
    cache: deps.cache,
    now: deps.now,
    clockSkewSeconds: deps.clockSkewSeconds,
    negativeTtlSeconds: deps.negativeTtlSeconds,
    maxCacheEntries: deps.maxCacheEntries,
    getLocalUrl: deps.getLocalUrl,
    sign: (object) => deps.sign({ postId: deps.postId, object }),
  });
}

/** Resolve um item de post pelo resolvedor vinculado. */
export function resolvePostMedia(
  resolver: MediaResolver,
  media: PostMediaLike,
): Promise<MediaResolution> {
  return resolver.resolve(classifyPostMediaItem(media));
}

export const POST_MEDIA_MAX_TTL_SECONDS = 300;

/**
 * Mapeia o resultado do server fn para o contrato do resolvedor.
 *
 * O `expiresIn` e derivado do `expiresAt` do servidor, mas CAPADO a 300s e nunca
 * negativo: relogios divergentes levam a expiracao conservadora (re-assinar),
 * nunca a tratar uma resposta como valida alem do permitido.
 */
export function mediaUrlResultToSignResult(
  result: { status: string; url?: string; expiresAt?: number },
  now: number = Date.now(),
): MediaSignResult {
  if (result.status === "ready" && typeof result.url === "string") {
    const derived =
      typeof result.expiresAt === "number"
        ? Math.floor((result.expiresAt - now) / 1000)
        : POST_MEDIA_MAX_TTL_SECONDS;
    const expiresIn = Math.max(0, Math.min(POST_MEDIA_MAX_TTL_SECONDS, derived));
    return { status: "ready", url: result.url, expiresIn };
  }
  if (result.status === "forbidden") return { status: "forbidden" };
  if (result.status === "missing") return { status: "missing" };
  return { status: "unavailable" };
}

export type SecurePostMediaPolicy = {
  isSigningEnabled: () => boolean;
};

/** Politica de producao: a flag de midia, subordinada ao Auth remoto. */
export function createDefaultSecurePostMediaPolicy(): SecurePostMediaPolicy {
  return { isSigningEnabled: isMediaUrlSigningEnabled };
}

/**
 * Decide se um anexo deve ir para a resolucao segura. Fora destas quatro
 * condicoes, o consumidor permanece no caminho legado (local/preview).
 *
 * Demo mode/z no-auth nao dependem de `viewerId` remoto: sem espectador
 * validado, o resultado e `false` (legado) — nunca uma chamada sem identidade.
 */
export function shouldUseSecurePostMedia(input: {
  postId: string;
  viewerId: string | null | undefined;
  media: PostMediaLike;
  policy: SecurePostMediaPolicy;
}): boolean {
  if (!input.viewerId) return false;
  if (!isEligiblePostId(input.postId)) return false;
  if (!isCanonicalPostMedia(input.media)) return false;
  return input.policy.isSigningEnabled();
}
