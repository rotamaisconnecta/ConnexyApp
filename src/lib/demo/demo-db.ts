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
  text: string;
  at: number;
}

export interface DemoConnection {
  /** peer user id */
  userId: string;
  connectedAt: number;
}

export interface DemoRequest {
  id: string;
  fromUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

type DemoDB = {
  connections: DemoConnection[];
  requests: DemoRequest[];
  messages: DemoMessage[];
};

const DB_KEY = demoStorageKey("db");

function defaultDB(): DemoDB {
  return { connections: [], requests: [], messages: [] };
}

function read(): DemoDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw) as Partial<DemoDB>;
    return {
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
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

export function sendRequest(fromUserId: string): DemoRequest {
  const db = read();
  const existing = db.requests.find((r) => r.fromUserId === fromUserId && r.status === "pending");
  if (existing) return existing;
  const request: DemoRequest = {
    id: `demo-req-${Date.now()}`,
    fromUserId,
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

/* ─── Messages ────────────────────────────────────────────── */

export function getMessages(conversationId: string): DemoMessage[] {
  return read()
    .messages.filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.at - b.at);
}

export function getConversationLastMessage(conversationId: string): DemoMessage | null {
  const all = read()
    .messages.filter((m) => m.conversationId === conversationId)
    .sort((a, b) => b.at - a.at);
  return all[0] ?? null;
}

export function sendLocalMessage(
  conversationId: string,
  from: "me" | "them",
  text: string,
): DemoMessage {
  const db = read();
  const message: DemoMessage = {
    id: `demo-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    from,
    text,
    at: Date.now(),
  };
  db.messages.push(message);
  write(db);
  emitChange();
  return message;
}
