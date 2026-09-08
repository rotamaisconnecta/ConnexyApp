import { demoStorageKey } from "./demo-config";

/*
 * Local demo "database" persisted to localStorage under `connexy:demo:`.
 *
 * Holds connections, pending connection requests, direct conversations and
 * messages. Pure state + pub/sub so the UI can refresh live without Supabase
 * or Realtime. Never mixed with production data.
 */

export interface DemoMessage {
  id: string;
  conversationId: string;
  /** conversationId doubles as the peer user id in a direct conversation. */
  from: "me" | "them";
  senderId?: string;
  senderName?: string;
  text: string;
  at: number;
  /** The locally supported subset intentionally excludes audio: recording needs MediaRecorder. */
  kind?: "text" | "event" | "location" | "image" | "video";
  payload?: {
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
  };
}

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
  /** peer user id */
  userId: string;
  connectedAt: number;
}

export interface DemoRequest {
  id: string;
  fromUserId: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

type DemoDB = {
  connections: DemoConnection[];
  requests: DemoRequest[];
  messages: DemoMessage[];
  groups: DemoGroup[];
};

const DB_KEY = demoStorageKey("db");
const DUPLICATE_SEND_WINDOW_MS = 1000;

function defaultDB(): DemoDB {
  return { connections: [], requests: [], messages: [], groups: [] };
}

function read(): DemoDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw) as Partial<DemoDB>;
    return {
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      requests: Array.isArray(parsed.requests)
        ? parsed.requests.map((request) => ({
            ...request,
            message: typeof request.message === "string" ? request.message : "",
          }))
        : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
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

/** Wipes every demo record (used by "reiniciar demonstração"). */
export function resetDemoData(): void {
  write(defaultDB());
  emitChange();
}

/* ─── Pub/Sub ─────────────────────────────────────────────── */

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeDemoDB(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  for (const l of listeners) l();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("connexy:demo:db"));
  }
}

/* ─── Connections ─────────────────────────────────────────── */

export function isConnected(userId: string): boolean {
  return read().connections.some((c) => c.userId === userId);
}

export function getConnectionsCount(): number {
  return read().connections.length;
}

/** Creates a direct connection and conversation with the peer. */
export function connectUser(userId: string): void {
  const db = read();
  const pendingRequest = db.requests.find(
    (request) => request.fromUserId === userId && request.status === "pending",
  );
  if (pendingRequest) pendingRequest.status = "accepted";
  if (!db.connections.some((connection) => connection.userId === userId)) {
    db.connections.push({ userId, connectedAt: Date.now() });
  }
  write(db);
  emitChange();
}

/* ─── Requests ────────────────────────────────────────────── */

export function sendRequest(fromUserId: string, message = ""): DemoRequest {
  const db = read();
  const existing = db.requests.find((r) => r.fromUserId === fromUserId && r.status === "pending");
  const normalizedMessage = message.trim();
  if (existing) {
    if (normalizedMessage && existing.message !== normalizedMessage) {
      existing.message = normalizedMessage;
      write(db);
      emitChange();
    }
    return existing;
  }
  const request: DemoRequest = {
    id: `demo-req-${Date.now()}`,
    fromUserId,
    message: normalizedMessage,
    status: "pending",
    createdAt: Date.now(),
  };
  db.requests.push(request);
  write(db);
  emitChange();
  return request;
}

export function hasPendingRequest(fromUserId: string): DemoRequest | null {
  return read().requests.find((r) => r.fromUserId === fromUserId && r.status === "pending") ?? null;
}

export function getPendingRequests(): DemoRequest[] {
  return read()
    .requests.filter((request) => request.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function declineRequest(fromUserId: string): void {
  const db = read();
  const pendingRequest = db.requests.find(
    (request) => request.fromUserId === fromUserId && request.status === "pending",
  );
  if (!pendingRequest) return;
  pendingRequest.status = "declined";
  write(db);
  emitChange();
}

/* ─── Derived group conversations ───────────────────────── */

export function getDemoGroup(groupId: string): DemoGroup | null {
  return read().groups.find((group) => group.id === groupId) ?? null;
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
  // A direct conversation id is the peer id in demo mode. They receive an explicit
  // group invite too; they are never silently promoted from the direct thread.
  const uniqueInvitees = [...new Set([sourceConversationId, ...invitedUserIds])].filter(
    (id) => id && id !== creatorId,
  );
  const now = Date.now();
  const group: DemoGroup = {
    id: `demo-group-${now}-${Math.random().toString(36).slice(2, 7)}`,
    sourceConversationId,
    name: name?.trim() || "Novo grupo",
    creatorId,
    createdAt: now,
    participants: [
      { userId: creatorId, status: "accepted", invitedAt: now, respondedAt: now },
      ...uniqueInvitees.map((userId) => ({ userId, status: "pending" as const, invitedAt: now })),
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
  return collapseMessages(
    read()
      .messages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.at - b.at),
  );
}

export function getConversationLastMessage(conversationId: string): DemoMessage | null {
  const all = getMessages(conversationId);
  return all[all.length - 1] ?? null;
}

export function sendLocalMessage(
  conversationId: string,
  from: "me" | "them",
  text: string,
  sender?: { id: string; name: string },
): DemoMessage {
  const db = read();
  const now = Date.now();
  const duplicate = [...db.messages]
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
  db.messages.push(message);
  write(db);
  emitChange();
  return message;
}

/** Stores only small media previews. Large files stay out of localStorage by design. */
export function sendLocalMediaMessage(
  conversationId: string,
  kind: "image" | "video",
  dataUrl: string,
  mimeType: string,
  fileName: string,
  sender?: { id: string; name: string },
): DemoMessage {
  const db = read();
  const now = Date.now();
  const message: DemoMessage = {
    id: `demo-media-${now}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    from: "me",
    senderId: sender?.id,
    senderName: sender?.name,
    text: fileName,
    at: now,
    kind,
    payload: { dataUrl, mimeType, fileName },
  };
  db.messages.push(message);
  write(db);
  emitChange();
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
): DemoMessage {
  const db = read();
  const now = Date.now();
  const kind: DemoMessage["kind"] = payload.type === "place" ? "location" : "event";
  const signal = `${payload.type}:${payload.id}:${conversationId}:${from}`;
  const duplicate = [...db.messages]
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
  db.messages.push(message);
  write(db);
  emitChange();
  return message;
}
