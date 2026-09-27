/* =========================================================
   chat-schema.ts — Schema IndexedDB de Conversas e Mensagens
   (Fase 1C-2, primeira migração-piloto).

   Apenas as stores necessárias são criadas: `conversations` e
   `messages`. O banco é INDEPENDENTE de `connexy-reels-local-db`
   (Reels) — que não é tocado, e a store `media` não é migrada
   para cá.

   Versionamento: começando em v1. Bumps futuros devem adicionar
   novos índices/stores em `applyUpgrade()` (nunca dropar dados).
   ========================================================= */

import type { PersistenceSchema } from "../types";

export const LOCAL_CHAT_DB_NAME = "connexy-app-local-db";

export const CONVERSATION_STORE = "conversations";
export const MESSAGE_STORE = "messages";
export const MESSAGE_INDEX_CONVERSATION = "by_conversation";

export const chatPersistenceSchema: PersistenceSchema = {
  name: LOCAL_CHAT_DB_NAME,
  version: 1,
  stores: [
    {
      name: CONVERSATION_STORE,
    },
    {
      name: MESSAGE_STORE,
      indexes: [
        // Consulta eficiente de mensagens por conversa
        // (ordenadas por `at` na camada de domínio).
        { name: MESSAGE_INDEX_CONVERSATION, keyPath: "conversationId" },
      ],
    },
  ],
};
