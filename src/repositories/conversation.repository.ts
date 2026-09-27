/* =========================================================
   conversation.repository.ts — ConversationRepository (Fase 1C-2).

   Repository de domínio de Conversas sobre a camada genérica
   LocalRepository (IndexedDB). Não conhece UI, rotas ou Supabase.

   A store `conversations` guarda o agregado de cada conversa
   (timestamps + último conteúdo), preservando o relacionamento
   messages.conversationId → conversations.id.
   ========================================================= */

import { LocalRepository } from "@/lib/persistence/local/local-repository";
import { CONVERSATION_STORE } from "@/lib/persistence/domain/chat-schema";
import type { StoredConversation, StoredMessage } from "@/lib/persistence/domain/chat-entities";
import { lastMessageKind } from "@/lib/persistence/domain/chat-entities";
import type { StorageAdapter } from "@/lib/persistence/types";

export class ConversationRepository extends LocalRepository<StoredConversation> {
  constructor(adapter: StorageAdapter) {
    super(adapter, CONVERSATION_STORE);
  }

  /** Lista as conversas ordenadas por última atividade (mais recente primeiro). */
  async listOrderedByUpdatedAt(): Promise<StoredConversation[]> {
    const records = await this.list();
    return records.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /** Cria a conversa se ainda não existir (mantém criada/se existente). */
  async ensureExists(id: string, createdAt: number): Promise<StoredConversation> {
    const existing = await this.get(id);
    if (existing) return existing;
    const record: StoredConversation = {
      id,
      createdAt,
      updatedAt: createdAt,
      lastMessageText: null,
      lastMessageType: null,
    };
    return this.put(record);
  }

  /**
   * Aplica uma mensagem recém-persistida ao agregado da conversa:
   * atualiza último conteúdo e timestamps (sem dual-write — a
   * mensagem continua existindo apenas em `messages`).
   */
  async applyLastMessage(
    conversationId: string,
    message: Pick<StoredMessage, "at" | "text" | "kind">,
  ): Promise<StoredConversation> {
    const existing = await this.get(conversationId);
    const record: StoredConversation = existing
      ? { ...existing }
      : {
          id: conversationId,
          createdAt: message.at,
          updatedAt: message.at,
          lastMessageText: null,
          lastMessageType: null,
        };
    record.updatedAt = message.at;
    record.lastMessageText = message.text;
    record.lastMessageType = lastMessageKind(message);
    return this.put(record);
  }
}
