import { useEffect, useState } from "react";
import type { MediaCache } from "@/lib/media/media-resolver";
import {
  classifyPostMediaItem,
  createDefaultSecurePostMediaPolicy,
  createPostMediaResolver,
  shouldUseSecurePostMedia,
  type PostMediaLike,
  type PostMediaSign,
  type SecurePostMediaPolicy,
} from "@/lib/media/post-media-resolver";
import { createSecurePostSigner } from "@/lib/media/post-media-signer";

/**
 * G4.5 — hook consumidor do resolvedor seguro de midia de posts.
 *
 * Comportamento por flag:
 *  - Flag OFF (default): `shouldUseSecurePostMedia` e `false` => `active` falso e
 *    NENHUMA chamada ao servidor. O consumidor usa o caminho legado.
 *  - Flag ON (+ Auth remoto + Supabase publico): itens canonicos de posts com id
 *    UUID e espectador autenticado sao resolvidos no servidor. Enquanto resolve,
 *    `url` e `null` (`active` ja e `true`): nao ha fallback publico.
 *
 * Cache compartilhado por instancia de Map e escopo = `viewerId` (mesma garantia
 * do `media-resolver`): trocar de usuario nao reutiliza URLs assinadas de outro.
 */

let sharedCache: MediaCache = new Map();

/** Test-only. Nao e caminho de producao. */
export function resetSecurePostMediaCacheForTests(next?: MediaCache): void {
  sharedCache = next ?? new Map();
}

export type SecurePostMediaState = {
  /** `true` quando o item foi desviado para a resolucao segura (mesmo sem url ainda). */
  active: boolean;
  url: string | null;
};

const defaultPolicy = createDefaultSecurePostMediaPolicy();

export function useSecurePostMediaUrl(input: {
  postId: string;
  viewerId?: string | null;
  media: PostMediaLike;
  policy?: SecurePostMediaPolicy;
  signerFactory?: () => PostMediaSign;
}): SecurePostMediaState {
  const policy = input.policy ?? defaultPolicy;
  const signerFactory = input.signerFactory ?? createSecurePostSigner;
  const media = input.media;
  const active = shouldUseSecurePostMedia({
    postId: input.postId,
    viewerId: input.viewerId,
    media,
    policy,
  });

  const viewerId = input.viewerId ?? null;
  const kind = media.type;
  const bucket = media.bucket;
  const path = media.path;

  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!active || viewerId === null || bucket === undefined || path === undefined) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    // Revalida pelo contrato antes de encaminhar (defesa em profundidade).
    const ref = classifyPostMediaItem({ type: kind, bucket, path });
    const resolver = createPostMediaResolver({
      postId: input.postId,
      authorizationScope: viewerId,
      cache: sharedCache,
      sign: signerFactory(),
    });
    resolver
      .resolve(ref)
      .then((result) => {
        if (cancelled) return;
        setUrl(result.status === "ready" ? result.url : null);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [active, bucket, kind, path, input.postId, signerFactory, viewerId]);

  return { active, url };
}
