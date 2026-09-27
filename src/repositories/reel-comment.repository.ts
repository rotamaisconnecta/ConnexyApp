/* =========================================================
   reel-comment.repository.ts — ReelCommentRepository (Fase 1C-3B).

   Repository de domínio de Comentários de Reels sobre a camada
   genérica LocalRepository (IndexedDB). Não conhece UI, rotas
   ou Supabase.

   Relacionamento reel_comments.reelId → reels.id. Comentários e replies
   são entidades normalizadas; parentId null/ausente identifica raiz e
   parentId string identifica o pai, sem limite artificial de profundidade.

   Ordenação determinística por `createdAt` (cronológica), igual à
   apresentação atual do feed (comentários na ordem de envio).
   Nota: o produto atual NÃO permite editar comentários — nenhum
   fluxo de edição é exposto nesta fase (a base update() da camada
   genérica permanece disponível para usos futuros).
   ========================================================= */

import { LocalRepository } from "@/lib/persistence/local/local-repository";
import { REEL_COMMENT_INDEX_REEL, REEL_COMMENT_STORE } from "@/lib/persistence/domain/reels-schema";
import type { StoredReelComment } from "@/lib/persistence/domain/reels-entities";
import { PersistenceError, PersistenceErrorCode } from "@/lib/persistence/errors";
import type { EntityId, StorageAdapter } from "@/lib/persistence/types";

function parsedTime(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

const byCreatedAtAsc = (a: StoredReelComment, b: StoredReelComment) =>
  parsedTime(a.createdAt) - parsedTime(b.createdAt) || a.id.localeCompare(b.id);

const bySiblingOrder = (a: StoredReelComment, b: StoredReelComment) => {
  const aOrder = typeof a.siblingOrder === "number" ? a.siblingOrder : Number.MAX_SAFE_INTEGER;
  const bOrder = typeof b.siblingOrder === "number" ? b.siblingOrder : Number.MAX_SAFE_INTEGER;
  return aOrder - bOrder || byCreatedAtAsc(a, b);
};

export class ReelCommentRepository extends LocalRepository<StoredReelComment> {
  constructor(adapter: StorageAdapter) {
    super(adapter, REEL_COMMENT_STORE);
  }

  /**
   * Persiste raiz/reply após validar referência, Reel e ausência de ciclos.
   * Repetir o mesmo registro continua sendo um upsert idempotente.
   */
  override async put(comment: StoredReelComment): Promise<StoredReelComment> {
    if (
      comment.siblingOrder != null &&
      (!Number.isInteger(comment.siblingOrder) || comment.siblingOrder < 0)
    ) {
      throw this.invalidHierarchy(comment.id, "siblingOrder deve ser inteiro não-negativo");
    }

    const parentId = comment.parentId ?? null;
    if (parentId === null) return super.put(comment);
    if (!parentId || parentId === comment.id) {
      throw this.invalidHierarchy(comment.id, "parentId inválido ou autorreferente");
    }

    const visited = new Set<string>([comment.id]);
    let ancestorId: string | null = parentId;
    while (ancestorId) {
      if (visited.has(ancestorId)) {
        throw this.invalidHierarchy(comment.id, "ciclo detectado na cadeia de replies");
      }
      visited.add(ancestorId);
      const ancestor = await this.get(ancestorId);
      if (!ancestor) {
        throw this.invalidHierarchy(comment.id, `comentário pai "${ancestorId}" inexistente`);
      }
      if (ancestor.reelId !== comment.reelId) {
        throw this.invalidHierarchy(comment.id, "comentário pai pertence a outro Reel");
      }
      ancestorId = ancestor.parentId ?? null;
    }

    return super.put(comment);
  }

  /** Comentários de um Reel, em ordem cronológica (determinística). */
  async listByReel(reelId: string): Promise<StoredReelComment[]> {
    const rows = await this.adapter.getAllByIndex<StoredReelComment>(
      this.store,
      REEL_COMMENT_INDEX_REEL,
      reelId,
    );
    return rows.map((row) => this.serializer.decode(row)).sort(byCreatedAtAsc);
  }

  /**
   * Lista raízes ou filhos diretos em ordem estável. Registros antigos sem
   * parentId são interpretados como raízes.
   */
  async listByParent(reelId: string, parentId: string | null): Promise<StoredReelComment[]> {
    const comments = await this.listByReel(reelId);
    return comments
      .filter((comment) => (comment.parentId ?? null) === parentId)
      .sort(bySiblingOrder);
  }

  /** Quantidade de comentários de um Reel (derivado). */
  async countByReel(reelId: string): Promise<number> {
    const comments = await this.listByReel(reelId);
    return comments.length;
  }

  /** Remove um comentário e todos os descendentes, sem deixar órfãos. */
  override async delete(id: EntityId): Promise<void> {
    const root = await this.get(id);
    if (!root) return;

    const comments = await this.listByReel(root.reelId);
    const childrenByParent = new Map<string, StoredReelComment[]>();
    for (const comment of comments) {
      const parentId = comment.parentId ?? null;
      if (!parentId) continue;
      const children = childrenByParent.get(parentId) ?? [];
      children.push(comment);
      childrenByParent.set(parentId, children);
    }

    const visited = new Set<string>();
    const remove = async (commentId: string): Promise<void> => {
      if (visited.has(commentId)) return;
      visited.add(commentId);
      for (const child of childrenByParent.get(commentId) ?? []) {
        await remove(child.id);
      }
      await super.delete(commentId);
    };
    await remove(id);
  }

  private invalidHierarchy(id: string, reason: string): PersistenceError {
    return new PersistenceError(
      `Comentário "${id}" possui hierarquia inválida: ${reason}`,
      PersistenceErrorCode.SERIALIZATION,
    );
  }
}
