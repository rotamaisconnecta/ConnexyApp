/* =========================================================
   chat-entities.ts — Modelo de persistência local de Conversas
   e Mensagens (Fase 1C-2).

   A UI nunca deve conhecer IndexedDB. Estes tipos são o formato
   CANÔNICO armazenado nas stores `conversations` e `messages` do
   banco local (`connexy-app-local-db`).

   Regras da fase:
   - Preservar a estrutura real já usada pela aplicação (o antigo
     `DemoMessage` de demo-db tinha exatamente este formato).
   - Valores serializáveis (números/strings/objetos simples). Sem
     `Date`, sem referências React, sem funções — `at` e
     timestamps são epoch milliseconds, como no storage legado.
   - Nenhum campo especulativo. `StoredConversation` guarda apenas
     o que a aplicação realmente deriva/persiste hoje.
   ========================================================= */

import type { PersistedEntity } from "../types";

/* ─── Message ────────────────────────────────────────────── */

export const StoredMessageKind = {
  TEXT: "text",
  EVENT: "event",
  LOCATION: "location",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
} as const;

export type StoredMessageKindValue = (typeof StoredMessageKind)[keyof typeof StoredMessageKind];

export interface StoredMessagePayload {
  id?: string;
  title?: string;
  cover?: string;
  location?: string;
  dateText?: string;
  proximity?: string;
  route?: string;
  routeType?: "event" | "place";
  dataUrl?: string;
  mimeType?: string;
  fileName?: string;
  width?: number;
  height?: number;
}

export interface StoredMessage extends PersistedEntity {
  id: string;
  /** id da conversa (thread) — relacionamento messages.conversationId → conversations.id. */
  conversationId: string;
  from: "me" | "them";
  senderId?: string;
  senderName?: string;
  /** Conteúdo principal. Para anexos, o nome/legenda. */
  text: string;
  /** Epoch milliseconds de criação. */
  at: number;
  /** Subconjunto suportado localmente. Áudio entra só como kind de lista (sem MediaRecorder). */
  kind?: StoredMessageKindValue;
  payload?: StoredMessagePayload;
}

/* ─── Conversation ──────────────────────────────────────── */

export interface StoredConversation extends PersistedEntity {
  id: string;
  /** Epoch milliseconds de criação da conversa. */
  createdAt: number;
  /** Epoch milliseconds da última atividade. */
  updatedAt: number;
  /** Último conteúdo (texto/legenda). null quando ainda não há mensagens. */
  lastMessageText: string | null;
  lastMessageType: StoredMessageKindValue | null;
  /** Identidades que fixaram esta conversa. Isolamento por `getDemoIdentity().id`. */
  pinnedByUserIds?: string[];
  /** Epoch da última ação de lista (Ouvir/Confirmar/Retomar) resolvida sem abrir o thread. */
  gestureHandledAt?: number;
}

/** Mapeia o kind de uma mensagem para o tipo usado no resumo de conversa. */
export function lastMessageKind(message: Pick<StoredMessage, "kind">): StoredMessageKindValue {
  return message.kind ?? StoredMessageKind.TEXT;
}
