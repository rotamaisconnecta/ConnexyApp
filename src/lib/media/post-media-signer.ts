import { getPostMediaUrl } from "./media-url.functions";
import { mediaUrlResultToSignResult, type PostMediaSign } from "./post-media-resolver";

/**
 * G4.5 — unico consumidor de runtime de `getPostMediaUrl`.
 *
 * Importar esta funcao aqui e o que coloca `media-url.functions.ts` no grafo de
 * build do TanStack Start (server function client-referenced). Nao duplica
 * autenticacao nem autorizacao: apenas traduz o anexo canonico `(bucket, path)`
 * para o localizador `identity` do contrato existente e delega ao servidor.
 *
 * O cliente NUNCA decide bucket/path privilegiado: `bucket`/`path` vem do item
 * ja registrado em `posts.media` e ainda sao revalidados no servidor contra a
 * linha autorizada (RLS). A resposta e sempre fechada: erro/expiracao/auth nao
 * produzem URL publica.
 */
export function createSecurePostSigner(): PostMediaSign {
  return async ({ postId, object }) => {
    const result = await getPostMediaUrl({
      data: {
        postId,
        locator: { kind: "identity", bucket: object.bucket, path: object.path },
      },
    });
    return mediaUrlResultToSignResult(result);
  };
}
