import { demoStorageKey, DEMO_DB_EVENT } from "./demo-config";
import {
  clearLocalChat,
  ensureLocalChatLoaded,
  ensureLocalConversation,
  getLocalChatMessages,
  putLocalChatMessage,
  touchLocalConversation,
} from "@/lib/chat/local-chat-persistence";
import type { StoredMessage } from "@/lib/persistence/domain/chat-entities";
import { currentUser } from "@/lib/mock-data";
import { getDemoIdentity } from "./demo-identity";
import { resetDemoPostComments } from "./demo-post-comments";
import { clearAllLocalMedia } from "@/lib/media/local-media-storage";

/*
 * Local demo "database" persisted to localStorage under `connexy:demo:`.
 *
 * Holds connections, pending connection requests, direct conversations and
 * groups. Pure state + pub/sub so the UI can refresh live without Supabase
 * or Realtime. Never mixed with production data.
 *
 * Fase 1C-2: MENSAGENS deixaram de ser gravadas neste "banco" de
 * localStorage. Elas agora são persistidas em IndexedDB (store
 * `messages`) através de `MessageRepository`, exposto por
 * `local-chat-persistence`. O array `messages` legado permanece no
 * blob apenas como dados preservados (migrados de forma idempotente),
 * sem novos escritos — sem dual-write.
 */

/** Mensagem local usada pela camada demo — formato idêntico ao
 * `StoredMessage` persistido em IndexedDB (Fase 1C-2). O nome legado
 * é mantido para não quebrar consumidores existentes. */
export type DemoMessage = StoredMessage;

export type DemoInvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface DemoGroupParticipant {
  userId: string;
  status: DemoInvitationStatus;
  invitedAt: number;
  respondedAt?: number;
}

export interface DemoGroup {
  id: string;
  /** The direct thread this group was derived from. It is never reused for group messages. */
  sourceConversationId: string;
  name: string;
  creatorId: string;
  createdAt: number;
  participants: DemoGroupParticipant[];
}

export interface DemoConnection {
  userAId: string;
  userBId: string;
  conversationId: string;
  connectedAt: number;
}

export interface DemoRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

export interface DemoFollow {
  followerId: string;
  followeeId: string;
  createdAt: number;
}

type DemoDB = {
  connections: DemoConnection[];
  requests: DemoRequest[];
  messages: DemoMessage[];
  groups: DemoGroup[];
  follows: DemoFollow[];
};

const DB_KEY = demoStorageKey("db");
const DUPLICATE_SEND_WINDOW_MS = 1000;

export function demoSocialStorageKey(): string {
  return DB_KEY;
}

function defaultDB(): DemoDB {
  return { connections: [], requests: [], messages: [], groups: [], follows: [] };
}

function directConversationId(userAId: string, userBId: string): string {
  return `demo-direct-${[userAId, userBId].sort().join("--")}`;
}

function normalizeConnection(value: unknown): DemoConnection | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.userAId === "string" &&
    typeof record.userBId === "string" &&
    typeof record.conversationId === "string" &&
    typeof record.connectedAt === "number"
  ) {
    return record as unknown as DemoConnection;
  }

  // Legacy records were global and stored only the peer of the default demo user.
  if (typeof record.userId === "string" && typeof record.connectedAt === "number") {
    return {
      userAId: currentUser.id,
      userBId: record.userId,
      conversationId: record.userId,
      connectedAt: record.connectedAt,
    };
  }
  return null;
}

function normalizeFollow(value: unknown): DemoFollow | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.followerId !== "string" ||
    typeof record.followeeId !== "string" ||
    typeof record.createdAt !== "number"
  ) {
    return null;
  }
  return {
    followerId: record.followerId,
    followeeId: record.followeeId,
    createdAt: record.createdAt,
  };
}

function normalizeRequest(value: unknown): DemoRequest | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.fromUserId !== "string" ||
    typeof record.status !== "string" ||
    typeof record.createdAt !== "number"
  ) {
    return null;
  }

  return {
    id: record.id,
    fromUserId: record.fromUserId,
    // Legacy requests were rendered as incoming to the default demo identity.
    toUserId: typeof record.toUserId === "string" ? record.toUserId : currentUser.id,
    message: typeof record.message === "string" ? record.message : "",
    status:
      record.status === "accepted" || record.status === "declined" ? record.status : "pending",
    createdAt: record.createdAt,
  };
}

function read(): DemoDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw) as Partial<DemoDB>;
    return {
      connections: Array.isArray(parsed.connections)
        ? parsed.connections
            .map(normalizeConnection)
            .filter((item): item is DemoConnection => !!item)
        : [],
      requests: Array.isArray(parsed.requests)
        ? parsed.requests.map(normalizeRequest).filter((item): item is DemoRequest => !!item)
        : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      follows: Array.isArray(parsed.follows)
        ? parsed.follows.map(normalizeFollow).filter((item): item is DemoFollow => item != null)
        : [],
    };
  } catch {
    return defaultDB();
  }
}

function write(db: DemoDB): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable */
  }
}

/** Wipes every demo record (used by "reiniciar demonstração").
 *  Também limpa as stores locais de Conversas/Mensagens (IndexedDB). */
export function resetDemoData(): void {
  write(defaultDB());
  void clearLocalChat();
  resetDemoPostComments();
  void clearAllLocalMedia();
  emitChange();
}

/* ─── Pub/Sub ─────────────────────────────────────────────── */

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeDemoDB(listener: Listener): () => void {
  if (typeof window !== "undefined") {
    window.addEventListener(DEMO_DB_EVENT, listener);
    return () => window.removeEventListener(DEMO_DB_EVENT, listener);
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  for (const l of listeners) l();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DEMO_DB_EVENT));
  }
}

/* ─── Connections ─────────────────────────────────────────── */

function connectionIncludes(connection: DemoConnection, userId: string): boolean {
  return connection.userAId === userId || connection.userBId === userId;
}

export function getConnectionPeerId(connection: DemoConnection, userId: string): string | null {
  if (connection.userAId === userId) return connection.userBId;
  if (connection.userBId === userId) return connection.userAId;
  return null;
}

export function getConnectionsForUser(userId: string): DemoConnection[] {
  return read()
    .connections.filter((connection) => connectionIncludes(connection, userId))
    .sort((a, b) => b.connectedAt - a.connectedAt);
}

export function getConnectionBetween(userId: string, peerUserId: string): DemoConnection | null {
  return (
    read().connections.find(
      (connection) =>
        connectionIncludes(connection, userId) && connectionIncludes(connection, peerUserId),
    ) ?? null
  );
}

export function getConnectionByConversationId(
  conversationId: string,
  userId?: string,
): DemoConnection | null {
  return (
    read().connections.find(
      (connection) =>
        connection.conversationId === conversationId &&
        (!userId || connectionIncludes(connection, userId)),
    ) ?? null
  );
}

export function isConnected(peerUserId: string, userId = getDemoIdentity().id): boolean {
  return getConnectionBetween(userId, peerUserId) != null;
}

export function getConnectionsCount(userId = getDemoIdentity().id): number {
  return getConnectionsForUser(userId).length;
}

export function isFollowing(followeeId: string, followerId = getDemoIdentity().id): boolean {
  if (!followeeId || !followerId || followeeId === followerId) return false;
  return read().follows.some(
    (follow) => follow.followerId === followerId && follow.followeeId === followeeId,
  );
}

export function listFollowees(followerId = getDemoIdentity().id): string[] {
  return read()
    .follows.filter((follow) => follow.followerId === followerId)
    .sort((left, right) => right.createdAt - left.createdAt)
    .map((follow) => follow.followeeId);
}

export function toggleFollow(followeeId: string, followerId = getDemoIdentity().id): boolean {
  if (!followeeId || !followerId || followeeId === followerId) return false;
  const db = read();
  const existingIndex = db.follows.findIndex(
    (follow) => follow.followerId === followerId && follow.followeeId === followeeId,
  );
  if (existingIndex >= 0) {
    db.follows.splice(existingIndex, 1);
    write(db);
    emitChange();
    return false;
  }
  db.follows.push({ followerId, followeeId, createdAt: Date.now() });
  write(db);
  emitChange();
  return true;
}

/* ─── Requests ────────────────────────────────────────────── */

export function sendRequest(fromUserId: string, toUserId: string, message = ""): DemoRequest {
  if (!fromUserId || !toUserId || fromUserId === toUserId) {
    throw new Error("Remetente e destinatário da solicitação são inválidos.");
  }
  const db = read();
  const connected = db.connections.some(
    (connection) =>
      connectionIncludes(connection, fromUserId) && connectionIncludes(connection, toUserId),
  );
  if (connected) {
    const accepted = db.requests.find(
      (request) =>
        request.fromUserId === fromUserId &&
        request.toUserId === toUserId &&
        request.status === "accepted",
    );
    if (accepted) return accepted;
    throw new Error("Estas identidades já estão conectadas.");
  }
  const existing = db.requests.find(
    (request) =>
      request.fromUserId === fromUserId &&
      request.toUserId === toUserId &&
      request.status === "pending",
  );
  const normalizedMessage = message.trim();
  if (existing) {
    if (normalizedMessage && existing.message !== normalizedMessage) {
      existing.message = normalizedMessage;
      write(db);
      emitChange();
    }
    return existing;
  }

  const previous = db.requests.find(
    (request) => request.fromUserId === fromUserId && request.toUserId === toUserId,
  );
  if (previous) {
    previous.message = normalizedMessage;
    previous.status = "pending";
    previous.createdAt = Date.now();
    write(db);
    emitChange();
    return previous;
  }

  const request: DemoRequest = {
    id: `demo-req-${fromUserId}--${toUserId}`,
    fromUserId,
    toUserId,
    message: normalizedMessage,
    status: "pending",
    createdAt: Date.now(),
  };
  db.requests.push(request);
  write(db);
  emitChange();
  return request;
}

export function getOutgoingPendingRequest(
  fromUserId: string,
  toUserId: string,
): DemoRequest | null {
  return (
    read().requests.find(
      (request) =>
        request.fromUserId === fromUserId &&
        request.toUserId === toUserId &&
        request.status === "pending",
    ) ?? null
  );
}

export function getRequestBetween(fromUserId: string, toUserId: string): DemoRequest | null {
  return (
    read().requests.find(
      (request) => request.fromUserId === fromUserId && request.toUserId === toUserId,
    ) ?? null
  );
}

export function getIncomingPendingRequest(
  fromUserId: string,
  toUserId: string,
): DemoRequest | null {
  return getOutgoingPendingRequest(fromUserId, toUserId);
}

export function getPendingRequests(toUserId = getDemoIdentity().id): DemoRequest[] {
  return read()
    .requests.filter((request) => request.toUserId === toUserId && request.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function declineRequest(fromUserId: string, toUserId: string): void {
  const db = read();
  const pendingRequest = db.requests.find(
    (request) =>
      request.fromUserId === fromUserId &&
      request.toUserId === toUserId &&
      request.status === "pending",
  );
  if (!pendingRequest) return;
  pendingRequest.status = "declined";
  write(db);
  emitChange();
}

export async function acceptRequest(fromUserId: string, toUserId: string): Promise<DemoConnection> {
  const db = read();
  const pendingRequest = db.requests.find(
    (request) =>
      request.fromUserId === fromUserId &&
      request.toUserId === toUserId &&
      request.status === "pending",
  );
  const existing = db.connections.find(
    (connection) =>
      connectionIncludes(connection, fromUserId) && connectionIncludes(connection, toUserId),
  );
  if (existing) {
    if (pendingRequest) {
      pendingRequest.status = "accepted";
      write(db);
      emitChange();
    }
    await ensureLocalConversation(existing.conversationId);
    return existing;
  }
  if (!pendingRequest) throw new Error("Nenhuma solicitação pendente encontrada.");

  const connection: DemoConnection = {
    userAId: fromUserId,
    userBId: toUserId,
    conversationId: directConversationId(fromUserId, toUserId),
    connectedAt: Date.now(),
  };
  await ensureLocalConversation(connection.conversationId);
  pendingRequest.status = "accepted";
  db.connections.push(connection);
  write(db);
  emitChange();
  return connection;
}

/** Compatibility entry point for existing local callers. */
export async function connectUser(
  peerUserId: string,
  userId = getDemoIdentity().id,
): Promise<DemoConnection> {
  const existing = getConnectionBetween(userId, peerUserId);
  if (existing) {
    await ensureLocalConversation(existing.conversationId);
    return existing;
  }
  const db = read();
  const connection: DemoConnection = {
    userAId: userId,
    userBId: peerUserId,
    conversationId: directConversationId(userId, peerUserId),
    connectedAt: Date.now(),
  };
  await ensureLocalConversation(connection.conversationId);
  db.connections.push(connection);
  write(db);
  emitChange();
  return connection;
}

/* ─── Derived group conversations ───────────────────────── */

export function getDemoGroup(groupId: string): DemoGroup | null {
  return read().groups.find((group) => group.id === groupId) ?? null;
}

export function listDemoGroupsBySource(sourceConversationId: string): DemoGroup[] {
  return read().groups.filter((group) => group.sourceConversationId === sourceConversationId);
}

export function getDemoGroupsForUser(userId: string): DemoGroup[] {
  return read()
    .groups.filter((group) =>
      group.participants.some(
        (participant) => participant.userId === userId && participant.status === "accepted",
      ),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getDemoGroupInvitesForUser(userId: string): DemoGroup[] {
  return read()
    .groups.filter((group) =>
      group.participants.some(
        (participant) => participant.userId === userId && participant.status === "pending",
      ),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Creates a new group ID every time; the originating direct conversation is left untouched.
 * Duplicate ids and the creator are filtered before persistence.
 */
export function createDemoGroup(
  sourceConversationId: string,
  creatorId: string,
  invitedUserIds: string[],
  name?: string,
): DemoGroup {
  const db = read();
  const sourceConnection = db.connections.find(
    (connection) =>
      connection.conversationId === sourceConversationId &&
      connectionIncludes(connection, creatorId),
  );
  const sourcePeerId = sourceConnection
    ? getConnectionPeerId(sourceConnection, creatorId)
    : sourceConversationId;
  // The direct peer receives an explicit group invite; they are never silently
  // promoted from the originating direct thread.
  const uniqueInvitees = [...new Set([sourcePeerId, ...invitedUserIds])].filter(
    (id): id is string => typeof id === "string" && Boolean(id) && id !== creatorId,
  );
  const alreadyInvited = new Set(
    db.groups
      .filter((group) => group.sourceConversationId === sourceConversationId)
      .flatMap((group) =>
        group.participants
          .filter((participant) => participant.status === "pending" || participant.status === "accepted")
          .map((participant) => participant.userId),
      ),
  );
  const invitees = uniqueInvitees.filter((id) => !alreadyInvited.has(id));
  if (invitees.length === 0) {
    const existing = db.groups.find((group) => group.sourceConversationId === sourceConversationId);
    if (existing) return existing;
  }
  const now = Date.now();
  const group: DemoGroup = {
    id: `demo-group-${now}-${Math.random().toString(36).slice(2, 7)}`,
    sourceConversationId,
    name: name?.trim() || "Novo grupo",
    creatorId,
    createdAt: now,
    participants: [
      { userId: creatorId, status: "accepted", invitedAt: now, respondedAt: now },
      ...invitees.map((userId) => ({ userId, status: "pending" as const, invitedAt: now })),
    ],
  };
  db.groups.push(group);
  write(db);
  emitChange();
  return group;
}

/** Idempotently handles an invite. A response never creates a second participant. */
export function respondToDemoGroupInvite(
  groupId: string,
  userId: string,
  accepted: boolean,
): DemoGroup | null {
  const db = read();
  const group = db.groups.find((item) => item.id === groupId);
  const participant = group?.participants.find((item) => item.userId === userId);
  if (!group || !participant || participant.status !== "pending") return group ?? null;
  participant.status = accepted ? "accepted" : "declined";
  participant.respondedAt = Date.now();
  write(db);
  emitChange();
  return group;
}

export function leaveDemoGroup(groupId: string, userId: string): DemoGroup | null {
  const db = read();
  const group = db.groups.find((item) => item.id === groupId);
  const participant = group?.participants.find((item) => item.userId === userId);
  if (!group || !participant || participant.status !== "accepted") return group ?? null;
  participant.status = "cancelled";
  participant.respondedAt = Date.now();
  write(db);
  emitChange();
  return group;
}

/* ─── Messages ────────────────────────────────────────────── */

function collapseMessages(messages: DemoMessage[]): DemoMessage[] {
  const byId = new Map<string, DemoMessage>();
  for (const message of messages) byId.set(message.id, message);
  const ordered = [...byId.values()].sort((a, b) => a.at - b.at);
  const collapsed: DemoMessage[] = [];
  for (const message of ordered) {
    const previous = collapsed[collapsed.length - 1];
    if (
      previous &&
      previous.from === message.from &&
      previous.text === message.text &&
      Math.abs(message.at - previous.at) < DUPLICATE_SEND_WINDOW_MS
    ) {
      continue;
    }
    collapsed.push(message);
  }
  return collapsed;
}

export function getMessages(conversationId: string): DemoMessage[] {
  // Garante que a migração one-time e o load do IndexedDB foi disparado
  // (a leitura síncrona é servida pelo cache de local-chat-persistence).
  void ensureLocalChatLoaded();
  return collapseMessages(getLocalChatMessages(conversationId));
}

export function getConversationLastMessage(conversationId: string): DemoMessage | null {
  const all = getMessages(conversationId);
  return all[all.length - 1] ?? null;
}

/** Persiste a mensagem em IndexedDB (única fonte) e atualiza o agregado da conversa. */
function persistLocalMessage(conversationId: string, message: DemoMessage): void {
  // O cache síncrono é atualizado antes do await; a gravação no IndexedDB
  // acontece em background. Falhas não quebram a UI (console mantém visibilidade).
  void putLocalChatMessage(message).catch((error) =>
    console.warn("[connexy] falha ao persistir mensagem local", error),
  );
  void touchLocalConversation(conversationId, message).catch((error) =>
    console.warn("[connexy] falha ao atualizar conversa local", error),
  );
  emitChange();
}

export function sendLocalMessage(
  conversationId: string,
  from: "me" | "them",
  text: string,
  sender?: { id: string; name: string },
): DemoMessage {
  const now = Date.now();
  const duplicate = [...getLocalChatMessages(conversationId)]
    .reverse()
    .find(
      (message) =>
        message.conversationId === conversationId &&
        message.from === from &&
        message.text === text &&
        now - message.at < DUPLICATE_SEND_WINDOW_MS,
    );
  if (duplicate) return duplicate;

  const message: DemoMessage = {
    id: `demo-msg-${now}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    from,
    senderId: sender?.id,
    senderName: sender?.name,
    text,
    at: now,
  };
  persistLocalMessage(conversationId, message);
  return message;
}

/** Persiste metadados da mídia. O Blob fica no OPFS (ou fallback); dataUrl é legado. */
export function sendLocalMediaMessage(
  conversationId: string,
  kind: "image" | "video" | "audio" | "file",
  input: {
    mimeType: string;
    fileName: string;
    mediaId?: string;
    dataUrl?: string;
    durationSec?: number;
    fileSize?: number;
  },
  sender?: { id: string; name: string },
): DemoMessage {
  const now = Date.now();
  const message: DemoMessage = {
    id: `demo-media-${now}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    from: "me",
    senderId: sender?.id,
    senderName: sender?.name,
    text:
      kind === "image"
        ? "Foto"
        : kind === "video"
          ? "Vídeo"
          : kind === "file"
            ? input.fileName
            : "Áudio",
    at: now,
    kind,
    payload: {
      mediaId: input.mediaId,
      dataUrl: input.dataUrl,
      mimeType: input.mimeType,
      fileName: input.fileName,
      durationSec: input.durationSec,
      fileSize: input.fileSize,
    },
  };
  persistLocalMessage(conversationId, message);
  return message;
}

export function sendLocationMessage(
  conversationId: string,
  input: { label: string; proximity: string; lat: number; lng: number },
  sender?: { id: string; name: string },
): DemoMessage {
  const now = Date.now();
  const message: DemoMessage = {
    id: `demo-loc-${now}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    from: "me",
    senderId: sender?.id,
    senderName: sender?.name,
    text: input.label,
    at: now,
    kind: "location",
    payload: {
      title: input.label,
      proximity: input.proximity,
      lat: input.lat,
      lng: input.lng,
    },
  };
  persistLocalMessage(conversationId, message);
  return message;
}

export function sendSharedContentMessage(
  conversationId: string,
  from: "me" | "them",
  payload: {
    id: string;
    title: string;
    type: "event" | "place";
    cover?: string;
    location?: string;
    dateText?: string;
    proximity?: string;
    route?: string;
  },
  text?: string,
  sender?: { id: string; name: string },
): DemoMessage {
  const now = Date.now();
  const kind: DemoMessage["kind"] = payload.type === "place" ? "location" : "event";
  const signal = `${payload.type}:${payload.id}:${conversationId}:${from}`;
  const duplicate = [...getLocalChatMessages(conversationId)]
    .reverse()
    .find(
      (message) =>
        message.conversationId === conversationId &&
        message.from === from &&
        message.kind === kind &&
        message.payload?.id === payload.id &&
        now - message.at < DUPLICATE_SEND_WINDOW_MS,
    );
  if (duplicate) return duplicate;

  const message: DemoMessage = {
    id: `demo-shared-${signal}-${now}`,
    conversationId,
    from,
    senderId: sender?.id,
    senderName: sender?.name,
    text: text?.trim() || payload.title,
    at: now,
    kind,
    payload: {
      id: payload.id,
      title: payload.title,
      cover: payload.cover,
      location: payload.location,
      dateText: payload.dateText,
      proximity: payload.proximity,
      route: payload.route,
      routeType: payload.type,
    },
  };
  persistLocalMessage(conversationId, message);
  return message;
}
