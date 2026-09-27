/* =========================================================
   reel-like.repository.ts — ReelLikeRepository (Fase 1C-3B).

   Repository de domínio de Curtidas de Reels sobre a camada
   genérica LocalRepository (IndexedDB). Não conhece UI, rotas
   ou Supabase.

   REGRA DE UNICIDADE (Fase 1C-3B §8): um usuário pode ter no
   máximo uma curtida por Reel. A infraestrutura genérica não expõe
   índice único composto; a unicidade é garantida pela chave
   primária determinística `reelLikeId(reelId, userId)` — `addLike`
   é IDEMPOTENTE (segunda curtida do mesmo usuário no mesmo Reel
   retorna a existente, sem duplicar). Usuários diferentes no mesmo
   Reel produzem curtidas distintas (identidade reelId + userId).
   ========================================================= */

import { LocalRepository } from "@/lib/persistence/local/local-repository";
import { REEL_LIKE_INDEX_REEL, REEL_LIKE_STORE } from "@/lib/persistence/domain/reels-schema";
import { reelLikeId, type StoredReelLike } from "@/lib/persistence/domain/reels-entities";
import type { StorageAdapter } from "@/lib/persistence/types";

export class ReelLikeRepository extends LocalRepository<StoredReelLike> {
  constructor(adapter: StorageAdapter) {
    super(adapter, REEL_LIKE_STORE);
  }

  /** Curtida de um usuário em um Reel (ou null). */
  async getByReelAndUser(reelId: string, userId: string): Promise<StoredReelLike | null> {
    return this.get(reelLikeId(reelId, userId));
  }

  /** true se o usuário curtiu o Reel. */
  async isLiked(reelId: string, userId: string): Promise<boolean> {
    return (await this.getByReelAndUser(reelId, userId)) !== null;
  }

  /**
   * Adiciona a curtida. IDEMPOTENTE: se o mesmo usuário já curtiu o
   * mesmo Reel, retorna a curtida existente (nunca duplica).
   */
  async addLike(reelId: string, userId: string): Promise<StoredReelLike> {
    const id = reelLikeId(reelId, userId);
    const existing = await this.get(id);
    if (existing) return existing;
    const like: StoredReelLike = {
      id,
      reelId,
      userId,
      createdAt: new Date().toISOString(),
    };
    return this.put(like);
  }

  /** Remove a curtida do usuário no Reel (idempotente). */
  async removeLike(reelId: string, userId: string): Promise<void> {
    await this.delete(reelLikeId(reelId, userId));
  }

  /** Curitdas de um Reel. */
  async listByReel(reelId: string): Promise<StoredReelLike[]> {
    const rows = await this.adapter.getAllByIndex<StoredReelLike>(
      this.store,
      REEL_LIKE_INDEX_REEL,
      reelId,
    );
    return rows.map((row) => this.serializer.decode(row));
  }

  /** Quantidade de curtidas de um Reel (derivado — sem contador duplicado). */
  async countByReel(reelId: string): Promise<number> {
    const likes = await this.listByReel(reelId);
    return likes.length;
  }
}
