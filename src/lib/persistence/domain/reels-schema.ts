/* =========================================================
   reels-schema.ts — Schema IndexedDB de Reels, Curtidas e
   Comentários (Fase 1C-3B).

   Banco DEDICADO e independente:
     - de `connexy-reels-local-db` (mídia de Reels — não tocada);
     - de `connexy-app-local-db` (chat da Fase 1C-2).

   A mídia de Reels permanece isolada; o banco de DOMÍNIO (reels,
   reel_likes, reel_comments) é versionado separadamente pela mesma
   infraestrutura genérica 1C-1 (PersistenceSchema + applyUpgrade).

   Unicidade de curtida é garantida na CAMADA DE DOMÍNIO via ids
   determinísticos `reelLikeId(reelId, userId)` como chave primária —
   a infraestrutura genérica não expõe índice único composto
   (decisão documentada na auditoria 1C-3B).
   ========================================================= */

import type { PersistenceSchema } from "../types";

export const REELS_DB_NAME = "connexy-reels-data-local-db";

export const REEL_STORE = "reels";
export const REEL_LIKE_STORE = "reel_likes";
export const REEL_COMMENT_STORE = "reel_comments";

export const REEL_LIKE_INDEX_REEL = "by_reel";
export const REEL_COMMENT_INDEX_REEL = "by_reel";

export const reelsPersistenceSchema: PersistenceSchema = {
  name: REELS_DB_NAME,
  version: 1,
  stores: [
    {
      name: REEL_STORE,
    },
    {
      name: REEL_LIKE_STORE,
      indexes: [
        // Curitdas por Reel (listar/contar sem varrer toda a store).
        { name: REEL_LIKE_INDEX_REEL, keyPath: "reelId" },
      ],
    },
    {
      name: REEL_COMMENT_STORE,
      indexes: [
        // Comentários por Reel (ordem cronológica na camada de domínio).
        { name: REEL_COMMENT_INDEX_REEL, keyPath: "reelId" },
      ],
    },
  ],
};
