import type { SchemaAClient } from "@/integrations/supabase/remote";
import type { CanonicalMediaObject } from "./media-contract";
import {
  createMediaUrlService,
  type AuthorizablePost,
  type MediaLocator,
  type MediaUrlService,
} from "./media-authorization";
import type { MediaSignResult } from "./media-resolver";
import { isMediaUrlSigningEnabled } from "./media-url-flag";

/**
 * G4 — montagem server-side da autorizacao + assinatura de midia.
 *
 * Este modulo e `*.server.ts`: NUNCA deve ser importado no bundle do cliente.
 *
 * Regras:
 *  - A publicacao e carregada com o cliente por requisicao (RLS), nao com a
 *    credencial privilegiada. A prova de autorizacao e a LINHA autorizada.
 *  - A assinatura usa credencial privilegiada EXCLUSIVAMENTE no servidor e so
 *    DEPOIS da autorizacao. Nenhuma URL/token e registrado em log.
 *  - A flag de midia permanece desligada por padrao; sem flag nao ha assinatura.
 */

/** Assinatura injetavel. Recebe o TTL ja limitado (60–300s) pelo servico. */
export type MediaSigner = (
  object: CanonicalMediaObject,
  ttlSeconds: number,
) => Promise<MediaSignResult>;

/** Leitor derivado de um cliente por requisicao (RLS). Nao confia no cliente. */
export type MediaRlsReader = {
  loadPost: (postId: string) => Promise<AuthorizablePost | null>;
  areConnected: (viewerId: string, authorId: string) => Promise<boolean>;
};

export function createSchemaARlsReader(supabase: SchemaAClient): MediaRlsReader {
  return {
    async loadPost(postId: string): Promise<AuthorizablePost | null> {
      const { data } = await supabase
        .from("posts")
        .select("id, author_id, privacy, media")
        .eq("id", postId)
        .maybeSingle();
      return data ?? null;
    },
    async areConnected(viewerId: string, authorId: string): Promise<boolean> {
      const { data } = await supabase
        .from("connections")
        .select("user_a_id, user_b_id")
        .or(
          `and(user_a_id.eq.${viewerId},user_b_id.eq.${authorId}),and(user_a_id.eq.${authorId},user_b_id.eq.${viewerId})`,
        )
        .maybeSingle();
      return Boolean(data);
    },
  };
}

/**
 * Assina com a credencial privilegiada (service role). Importada
 * dinamicamente para que a credencial nunca carregue no bundle do cliente e
 * para que a montagem do servico nao instancie admin antes de ser usada.
 */
export async function signMediaWithServiceRole(
  object: CanonicalMediaObject,
  ttlSeconds: number,
): Promise<MediaSignResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(object.bucket)
    .createSignedUrl(object.path, ttlSeconds);
  if (error || !data?.signedUrl) return { status: "unavailable" };
  return { status: "ready", url: data.signedUrl, expiresIn: ttlSeconds };
}

export type ServerMediaServiceInput = {
  /** Cliente por requisicao, autenticado com a sessao validada no servidor (RLS). */
  supabase: SchemaAClient;
  /** Identidade validada no servidor. Nunca aceitar `viewerId` do usuario final. */
  viewerId: string | null;
  /** Override apenas para testes; producao usa a assinatura com service role. */
  signer?: MediaSigner;
  /** Override apenas para testes; producao usa a flag de midia. */
  isEnabled?: () => boolean;
};

export function createServerMediaUrlService(input: ServerMediaServiceInput): MediaUrlService {
  const reader = createSchemaARlsReader(input.supabase);
  return createMediaUrlService({
    isEnabled: input.isEnabled ?? isMediaUrlSigningEnabled,
    getViewerId: async () => input.viewerId,
    loadPost: reader.loadPost,
    areConnected: reader.areConnected,
    sign: input.signer ?? signMediaWithServiceRole,
  });
}

export type { MediaLocator };
