/* =========================================================
   message.repository.ts — MessageRepository (Fase 1C-2).

   Repository de domínio de Mensagens sobre a camada genérica
   LocalRepository (IndexedDB). Não conhece UI, rotas ou Supabase.

   Usa o índice `messages.by_conversation` para listar mensagens
   de uma conversa e as ordena por `at` (ordem cronológica, igual
   ao fluxo atual do chat).
   ========================================================= */

import { LocalRepository } from "@/lib/persistence/local/local-repository";
import { MESSAGE_INDEX_CONVERSATION, MESSAGE_STORE } from "@/lib/persistence/domain/chat-schema";
import type { StoredMessage } from "@/lib/persistence/domain/chat-entities";
import type { StorageAdapter } from "@/lib/persistence/types";

const byTimestampAscending = (a: StoredMessage, b: StoredMessage) => a.at - b.at;

export class MessageRepository extends LocalRepository<StoredMessage> {
  constructor(adapter: StorageAdapter) {
    super(adapter, MESSAGE_STORE);
  }

  /** Mensagens de uma conversa, em ordem cronológica. */
  async listByConversation(conversationId: string): Promise<StoredMessage[]> {
    const rows = await this.adapter.getAllByIndex<StoredMessage>(
      this.store,
      MESSAGE_INDEX_CONVERSATION,
      conversationId,
    );
    return rows.map((record) => this.serializer.decode(record)).sort(byTimestampAscending);
  }

  /** Última mensagem de uma conversa (ou null se vazia). */
  async lastInConversation(conversationId: string): Promise<StoredMessage | null> {
    const messages = await this.listByConversation(conversationId);
    return messages[messages.length - 1] ?? null;
  }
}
