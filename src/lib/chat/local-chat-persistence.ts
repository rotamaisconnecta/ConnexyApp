/* =========================================================
   local-chat-persistence.ts — Facade de persistência local de
   Conversas e Mensagens (Fase 1C-2).

   PONTO DE ENTRADA da aplicação para o novo armazenamento:

     UI/Hook
       ↓
     (use-chat / use-demo-db / demo-db)
       ↓
     esta facade
       ↓
     ConversationRepository / MessageRepository
       ↓
     IndexedDbAdapter → IndexedDB

   A UI nunca acessa IndexedDB diretamente. A camada genérica
   (LocalRepository/IndexedDbAdapter) não conhece Conversa/Mensagem.

   Objetivos:
   - Repositórios singleton compartilhados (um adapter, um banco).
   - Leituras SÍNCRONAS para preservar as assinaturas atuais das
     funções de demo-db/hooks (cache em memória).
   - Migração one-time e idempotente dos dados legados
     (`connexy:demo:db.messages` do localStorage) para IndexedDB.
   - Sem dual-write: novas mensagens são gravadas SOMENTE em
     IndexedDB; a chave `connexy:demo:db` continua no localStorage
     (conexões/solicitações/grupos) e seus `messages` legados são
     preservados, apenas não são mais escritos.
   - SSR-safe: fora do browser, as operações não tocam o IndexedDB
     e o cache de memória fica vazio.
   ========================================================= */

import { IndexedDbAdapter } from "@/lib/persistence/local/indexed-db";
import {
  chatPersistenceSchema,
  CONVERSATION_STORE,
  MESSAGE_STORE,
} from "@/lib/persistence/domain/chat-schema";
import type { StoredConversation, StoredMessage } from "@/lib/persistence/domain/chat-entities";
import { lastMessageKind } from "@/lib/persistence/domain/chat-entities";
import { demoStorageKey, DEMO_DB_EVENT } from "@/lib/demo/demo-config";
import { ConversationRepository } from "@/repositories/conversation.repository";
import { MessageRepository } from "@/repositories/message.repository";
import { withPinnedUser } from "@/lib/chat/conversation-list-state";

/** Chave legada que guardava mensagens como parte do "banco" demo. */
const LEGACY_DB_KEY = demoStorageKey("db");

/* ─── Adapter/repositories singleton ────────────────────── */

let adapter: IndexedDbAdapter | null = null;
let conversationRepository: ConversationRepository | null = null;
let messageRepository: MessageRepository | null = null;

function ensureRepositories(): {
  conversations: ConversationRepository;
  messages: MessageRepository;
} {
  if (!conversationRepository || !messageRepository || !adapter) {
    adapter = new IndexedDbAdapter(chatPersistenceSchema);
    conversationRepository = new ConversationRepository(adapter);
    messageRepository = new MessageRepository(adapter);
  }
  return { conversations: conversationRepository, messages: messageRepository };
}

function canPersistLocally(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

/* ─── Cache síncrono ────────────────────────────────────── */

const messageCache = new Map<string, Map<string, StoredMessage>>();
const conversationCache = new Map<string, StoredConversation>();
const pendingWrites = new Set<Promise<unknown>>();
let hydratedFromLegacy = false;
let loadPromise: Promise<void> | null = null;

function cacheMessage(message: StoredMessage): void {
  let conversation = messageCache.get(message.conversationId);
  if (!conversation) {
    conversation = new Map();
    messageCache.set(message.conversationId, conversation);
  }
  conversation.set(message.id, message);
}

function rebuildMessageCache(messages: readonly StoredMessage[]): void {
  // Preserve optimistic messages written while the initial IndexedDB load is pending.
  for (const message of messages) cacheMessage(message);
}

function rebuildConversationCache(conversations: readonly StoredConversation[]): void {
  conversationCache.clear();
  for (const conversation of conversations) conversationCache.set(conversation.id, conversation);
}

function trackWrite<T>(promise: Promise<T>): Promise<T> {
  pendingWrites.add(promise);
  void promise.finally(() => pendingWrites.delete(promise)).catch(() => undefined);
  return promise;
}

function notifyDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_DB_EVENT));
}

function logWriteError(error: unknown): void {
  console.warn("[connexy] falha ao persistir dados localmente", error);
}

/* ─── Dados legados (localStorage) ──────────────────────── */

function readLegacyMessages(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_DB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { messages?: unknown };
    if (!Array.isArray(parsed.messages)) return [];
    return parsed.messages.filter((item): item is StoredMessage => isValidStoredMessage(item));
  } catch {
    return [];
  }
}

function isValidStoredMessage(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.conversationId === "string" &&
    (record.from === "me" || record.from === "them") &&
    typeof record.text === "string" &&
    typeof record.at === "number"
  );
}

function hydrateFromLegacy(): void {
  if (hydratedFromLegacy) return;
  hydratedFromLegacy = true;
  for (const message of readLegacyMessages()) cacheMessage(message);
}

/* ─── Migração one-time ─────────────────────────────────── */

async function migrateLegacyMessagesOnce(): Promise<number> {
  if (!canPersistLocally()) return 0;
  const { messages } = ensureRepositories();
  const legacy = readLegacyMessages();
  if (legacy.length === 0) return 0;
  const existingKeys = new Set(await adapter!.getAllKeys(MESSAGE_STORE));
  const legacyWithoutDuplicates: StoredMessage[] = [];
  const seen = new Set<string>();
  for (const message of legacy) {
    if (existingKeys.has(message.id) || seen.has(message.id)) continue;
    seen.add(message.id);
    legacyWithoutDuplicates.push(message);
  }
  for (const message of legacyWithoutDuplicates) await messages.put(message);
  return legacyWithoutDuplicates.length;
}

/* ─── Inicialização / carregamento ──────────────────────── */

/**
 * Garante que o banco local foi carregado no cache síncrono.
 * Idempotente. Falhas de persistência são logadas e o cache
 * legado permanece disponível (a UI nunca quebra por isso).
 */
export function ensureLocalChatLoaded(): Promise<void> {
  ensureRepositories();
  hydrateFromLegacy();
  if (!canPersistLocally() || loadPromise) return loadPromise ?? Promise.resolve();
  loadPromise = (async () => {
    try {
      await migrateLegacyMessagesOnce();
      const [allMessages, allConversations] = await Promise.all([
        messageRepository!.list(),
        conversationRepository!.listOrderedByUpdatedAt(),
      ]);
      rebuildMessageCache(allMessages);
      rebuildConversationCache(allConversations);
      notifyDataChanged();
    } catch (error) {
      console.warn("[connexy] falha ao sincronizar chat local com IndexedDB", error);
      loadPromise = null;
    }
  })();
  return loadPromise;
}

/* ─── Leituras síncronas (assinatura compatível com demo-db) ─ */

export function getLocalChatMessages(conversationId: string): StoredMessage[] {
  ensureRepositories();
  hydrateFromLegacy();
  const conversation = messageCache.get(conversationId);
  if (!conversation) return [];
  return [...conversation.values()].sort((a, b) => a.at - b.at);
}

export function getLocalChatMessage(conversationId: string, messageId: string): StoredMessage | null {
  ensureRepositories();
  hydrateFromLegacy();
  return messageCache.get(conversationId)?.get(messageId) ?? null;
}

export function listCachedLocalChatMessages(): StoredMessage[] {
  ensureRepositories();
  hydrateFromLegacy();
  const rows: StoredMessage[] = [];
  for (const conversation of messageCache.values()) {
    for (const message of conversation.values()) rows.push(message);
  }
  return rows;
}

function removeCachedMessage(conversationId: string, messageId: string): StoredMessage | null {
  const conversation = messageCache.get(conversationId);
  if (!conversation) return null;
  const current = conversation.get(messageId) ?? null;
  if (!current) return null;
  conversation.delete(messageId);
  if (conversation.size === 0) messageCache.delete(conversationId);
  return current;
}

export function getLocalChatLastMessage(conversationId: string): StoredMessage | null {
  const messages = getLocalChatMessages(conversationId);
  return messages[messages.length - 1] ?? null;
}

export function getLocalConversations(): StoredConversation[] {
  ensureRepositories();
  void ensureLocalChatLoaded();
  return [...conversationCache.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getLocalConversation(id: string): StoredConversation | null {
  ensureRepositories();
  void ensureLocalChatLoaded();
  return conversationCache.get(id) ?? null;
}

/* ─── Escritas (IndexedDB como única fonte persistida) ──── */

export function putLocalChatMessage(message: StoredMessage): Promise<void> {
  ensureRepositories();
  cacheMessage(message);
  if (!canPersistLocally()) return Promise.resolve();
  return trackWrite(
    ensureLocalChatLoaded().then(async () => {
      await messageRepository!.put(message);
      cacheMessage(message);
      notifyDataChanged();
    }),
  );
}

export function ensureLocalConversation(id: string): Promise<void> {
  const { conversations } = ensureRepositories();
  const cached = conversationCache.get(id);
  if (!canPersistLocally()) {
    if (!cached) {
      const now = Date.now();
      conversationCache.set(id, {
        id,
        createdAt: now,
        updatedAt: now,
        lastMessageText: null,
        lastMessageType: null,
      });
    }
    return Promise.resolve();
  }
  return trackWrite(
    ensureLocalChatLoaded().then(async () => {
      const conversation = await conversations.ensureExists(id, Date.now());
      const latest = conversationCache.get(id);
      const merged: StoredConversation = {
        ...conversation,
        pinnedByUserIds: latest?.pinnedByUserIds ?? conversation.pinnedByUserIds,
        gestureHandledAt: latest?.gestureHandledAt ?? conversation.gestureHandledAt,
      };
      if (
        merged.pinnedByUserIds !== conversation.pinnedByUserIds ||
        merged.gestureHandledAt !== conversation.gestureHandledAt
      ) {
        await conversations.put(merged);
      }
      conversationCache.set(merged.id, merged);
      notifyDataChanged();
    }),
  );
}

function cacheConversation(record: StoredConversation): StoredConversation {
  conversationCache.set(record.id, record);
  notifyDataChanged();
  return record;
}

function persistConversation(record: StoredConversation): Promise<StoredConversation> {
  cacheConversation(record);
  if (!canPersistLocally()) return Promise.resolve(record);
  const { conversations } = ensureRepositories();
  return trackWrite(
    ensureLocalChatLoaded().then(async () => {
      const existing = await conversations.get(record.id);
      const merged: StoredConversation = existing
        ? {
            ...existing,
            pinnedByUserIds: record.pinnedByUserIds ?? existing.pinnedByUserIds,
            gestureHandledAt: record.gestureHandledAt ?? existing.gestureHandledAt,
          }
        : record;
      await conversations.put(merged);
      return cacheConversation(merged);
    }),
  );
}

export function setLocalConversationPinned(
  conversationId: string,
  userId: string,
  pinned: boolean,
): Promise<StoredConversation> {
  ensureRepositories();
  const now = Date.now();
  const current = conversationCache.get(conversationId) ?? {
    id: conversationId,
    createdAt: now,
    updatedAt: now,
    lastMessageText: null,
    lastMessageType: null,
  };
  const next: StoredConversation = {
    ...current,
    pinnedByUserIds: withPinnedUser(current.pinnedByUserIds, userId, pinned),
  };
  return persistConversation(next);
}

export function markLocalListGestureHandled(
  conversationId: string,
  handledAt = Date.now(),
): Promise<StoredConversation> {
  ensureRepositories();
  const now = Date.now();
  const current = conversationCache.get(conversationId) ?? {
    id: conversationId,
    createdAt: now,
    updatedAt: now,
    lastMessageText: null,
    lastMessageType: null,
  };
  return persistConversation({ ...current, gestureHandledAt: handledAt });
}

export function touchLocalConversation(
  conversationId: string,
  message: StoredMessage,
): Promise<void> {
  const { conversations } = ensureRepositories();
  if (!canPersistLocally()) return Promise.resolve();
  return trackWrite(
    ensureLocalChatLoaded().then(async () => {
      const conversation = await conversations.applyLastMessage(conversationId, message);
      conversationCache.set(conversation.id, conversation);
      notifyDataChanged();
    }),
  );
}

export async function persistDeleteLocalChatMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  ensureRepositories();
  const current = getLocalChatMessage(conversationId, messageId);
  if (!current) {
    throw new Error("Mensagem inexistente nesta conversa.");
  }
  if (!canPersistLocally()) {
    removeCachedMessage(conversationId, messageId);
    notifyDataChanged();
    return;
  }
  await trackWrite(
    ensureLocalChatLoaded().then(async () => {
      const persisted = await messageRepository!.get(messageId);
      if (persisted && persisted.conversationId !== conversationId) {
        throw new Error("Mensagem inexistente nesta conversa.");
      }
      if (persisted) {
        await messageRepository!.delete(messageId);
      }
      removeCachedMessage(conversationId, messageId);
      notifyDataChanged();
    }),
  );
}

export async function refreshLocalConversationSummary(conversationId: string): Promise<void> {
  const last = getLocalChatLastMessage(conversationId);
  const { conversations } = ensureRepositories();
  const cached = conversationCache.get(conversationId);
  const nextSummary = (current: StoredConversation): StoredConversation => ({
    ...current,
    lastMessageText: last?.text ?? null,
    lastMessageType: last ? lastMessageKind(last) : null,
    updatedAt: last?.at ?? current.updatedAt,
  });
  if (!canPersistLocally()) {
    if (cached) {
      conversationCache.set(conversationId, nextSummary(cached));
      notifyDataChanged();
    }
    return;
  }
  await trackWrite(
    ensureLocalChatLoaded().then(async () => {
      const existing = (await conversations.get(conversationId)) ?? cached;
      if (!existing) return;
      const next = nextSummary(existing);
      await conversations.put(next);
      conversationCache.set(next.id, next);
      notifyDataChanged();
    }),
  );
}

export async function flushLocalChatPersistence(): Promise<void> {
  await ensureLocalChatLoaded();
  while (pendingWrites.size > 0) {
    await Promise.all([...pendingWrites]);
  }
}

/* ─── Reset (painel demo "reiniciar demonstração") ──────── */

export function clearLocalChat(): Promise<void> {
  const { conversations, messages } = ensureRepositories();
  const clearPersisted = canPersistLocally()
    ? flushLocalChatPersistence().then(() => Promise.all([conversations.clear(), messages.clear()]))
    : Promise.resolve();
  return clearPersisted
    .then(() => {
      messageCache.clear();
      conversationCache.clear();
      hydratedFromLegacy = false;
      loadPromise = null;
    })
    .catch(logWriteError);
}
