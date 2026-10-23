import { LocalMediaFrame } from "./local-media-frame";
import { useSecurePostMediaUrl } from "@/hooks/use-secure-post-media-url";
import type { PostMediaLike } from "@/lib/media/post-media-resolver";

/**
 * G4.5 — fronteira de render de um ANEXO DE PUBLICACAO.
 *
 * Escopo deliberadamente restrito a posts (nao e usado pelo chat). A decisao de
 * rota vive no hook/resolvedor, nunca espalhada no JSX:
 *  - item elegivel + flag ON => renderiza a URL assinada; falha/negacao => `null`
 *    (sem fallback publico);
 *  - caso contrario => comportamento legado inalterado (`LocalMediaFrame`:
 *    mídia local OPFS + preview).
 */
export function PostMediaFrame({
  postId,
  viewerId,
  media,
  children,
}: {
  postId: string;
  viewerId?: string | null;
  media: PostMediaLike;
  children: (url: string | null) => React.ReactNode;
}) {
  const secure = useSecurePostMediaUrl({ postId, viewerId, media });

  if (secure.active) {
    return <>{children(secure.url)}</>;
  }

  return (
    <LocalMediaFrame mediaId={media.mediaId} fallbackUrl={media.preview}>
      {children}
    </LocalMediaFrame>
  );
}
