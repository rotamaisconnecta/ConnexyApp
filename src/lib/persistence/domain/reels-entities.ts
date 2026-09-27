/* =========================================================
   reels-entities.ts — Modelo de persistência local de Reels,
   Curtidas e Comentários (Fase 1C-3B).

   Formato CANÔNICO armazenado nas stores `reels`, `reel_likes`
   e `reel_comments` do banco local (`connexy-reels-data-local-db`),
   via infraestrutura genérica (PersistenceSchema + LocalRepository).

   A UI nunca deve conhecer IndexedDB. Estes tipos espelham o modelo
   REAL encontrado na auditoria 1C-3A:
     - StoredReel          → metadata persistida (igual ao formato
                             StoredPublishedReel do fluxo 3A/3B);
     - StoredReelLike      → curtida por usuário + Reel;
     - StoredReelComment   → comentário/reply normalizado do fluxo atual;
                             `parentId` preserva a árvore recursiva e
                             `siblingOrder` preserva a ordem entre irmãos.

   Regras:
   - Valores serializáveis (JSON puro). Sem Date, funções ou Blobs —
     a mídia continua isolada em `connexy-reels-local-db` (media).
   - Contadores agregados NÃO são fonte primária: curtidas e
     comentários ficam nas próprias coleções e são derivados pelos
     repositories (countByReel).
   ========================================================= */

import type { PersistedEntity } from "../types";

/* ─── Reel (metadata persistente) ───────────────────────── */

export type StoredReelCategoryValue =
  | "PERSON"
  | "BUSINESS"
  | "EVENT"
  | "PLACE"
  | "OFFER"
  | "DRIVER"
  | "NETWORKING"
  | "TRAVEL"
  | "MOMENT";

export type StoredReelContextType = "local" | "negocio" | "oferta" | "evento";

export type StoredReelPersistence = "supabase" | "local";

/** Espelha ReelAuthor da auditoria 1C-3A (reel-types.ts). */
export interface StoredReelAuthor {
  id: string;
  name: string;
  handle: string;
  photoUrl: string;
  verified: boolean;
  profession: string | null;
  isFollowing: boolean;
}

/** Espelha ReelContextRef da Fase 3A (referência, nunca a entidade inteira). */
export interface StoredReelContextRef {
  tipo: StoredReelContextType;
  id: string;
  titulo: string;
}

export interface StoredReel extends PersistedEntity {
  id: string;
  /** Legenda/descrição do Reel. */
  caption: string;
  /** Categoria persistida (espelha Reel.category). */
  category: StoredReelCategoryValue;
  /** Autor persistido (snapshot de perfil no momento da gravação). */
  author: StoredReelAuthor;
  /** Contexto ancorado (local/negócio/oferta/evento) ou null. */
  context: StoredReelContextRef | null;
  /** Duração em segundos (validação 3A). */
  durationS: number;
  /** ISO de criação. */
  createdAt: string;
  /** Onde foi publicado localmente: "supabase" | "local". */
  persistence: StoredReelPersistence;
}

/* ─── Like (curtida) ────────────────────────────────────── */

export interface StoredReelLike extends PersistedEntity {
  /** Chave determinística `${reelId}::${userId}` (garante unicidade). */
  id: string;
  reelId: string;
  userId: string;
  createdAt: string;
}

/**
 * Chave primária determinística de uma curtida.
 * Garante a regra "uma curtida por usuário por Reel" na própria id —
 * a infraestrutura genérica não expõe índice único composto.
 */
export function reelLikeId(reelId: string, userId: string): string {
  return `${reelId}::${userId}`;
}

/* ─── Comment (comentário) ──────────────────────────────── */

export interface StoredReelComment extends PersistedEntity {
  id: string;
  /** Relacionamento reel_comments.reelId → reels.id. */
  reelId: string;
  /**
   * null/undefined = comentário raiz; string = id do comentário pai.
   * Opcional no contrato para que registros 1C-3B já gravados, que não
   * possuíam este campo, continuem válidos. O repository normaliza a null.
   */
  parentId?: string | null;
  /**
   * Posição estável dentro do array de irmãos legado. null/undefined usa
   * fallback determinístico por createdAt + id para registros 1C-3B.
   */
  siblingOrder?: number | null;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  /** ISO de criação (ordenação cronológica determinística). */
  createdAt: string;
  /** Espelha ReelComment.likes — sem agregação nesta fase. */
  likes: number;
  /** Espelha ReelComment.likedByMe — flag do visualizador local. */
  likedByMe: boolean;
}
