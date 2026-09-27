/* =========================================================
   reel.repository.ts — ReelRepository (Fase 1C-3B).

   Repository de domínio de Reels sobre a camada genérica
   LocalRepository (IndexedDB). Não conhece UI, rotas ou Supabase.

   A store `reels` guarda apenas a metadata persistente do Reel
   (igual ao formato StoredPublishedReel do fluxo 3A/3B); a mídia
   continua no banco próprio de mídia (`connexy-reels-local-db`,
   store `media`) e curtidas/comentários vivem nas próprias coleções
   (contadores derivados via count*).
   ========================================================= */

import { LocalRepository } from "@/lib/persistence/local/local-repository";
import { REEL_STORE } from "@/lib/persistence/domain/reels-schema";
import type { StoredReel } from "@/lib/persistence/domain/reels-entities";
import type { StorageAdapter } from "@/lib/persistence/types";
import type { ReelLikeRepository } from "./reel-like.repository";
import type { ReelCommentRepository } from "./reel-comment.repository";

const byCreatedAtDesc = (a: StoredReel, b: StoredReel) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

export class ReelRepository extends LocalRepository<StoredReel> {
  constructor(adapter: StorageAdapter) {
    super(adapter, REEL_STORE);
  }

  /** Reels por criação (mais recente primeiro), igual ao feed atual. */
  async listOrderedByRecent(): Promise<StoredReel[]> {
    const records = await this.list();
    return records.sort(byCreatedAtDesc);
  }
}

/**
 * Exclusão de Reel em cascata (regra de negócio na camada de domínio,
 * NÃO escondida no adapter): remove o Reel e limpa as curtidas e
 * comentários órfãos. Idempotente — registros ausentes são ignorados.
 */
export async function deleteReelWithCascade(
  reels: ReelRepository,
  likes: ReelLikeRepository,
  comments: ReelCommentRepository,
  reelId: string,
): Promise<void> {
  const reelLikes = await likes.listByReel(reelId);
  for (const like of reelLikes) await likes.delete(like.id);
  const reelComments = await comments.listByReel(reelId);
  for (const comment of reelComments) await comments.delete(comment.id);
  await reels.delete(reelId);
}
