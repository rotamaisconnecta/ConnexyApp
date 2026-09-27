import { beforeEach, describe, expect, test } from "bun:test";
import {
  acceptRequest,
  connectUser,
  declineRequest,
  demoSocialStorageKey,
  getConnectionBetween,
  getConnectionsCount,
  getIncomingPendingRequest,
  getOutgoingPendingRequest,
  getPendingRequests,
  getRequestBetween,
  isConnected,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { chatPersistenceSchema } from "../src/lib/persistence/domain/chat-schema";
import { shouldShowNearbyPerson } from "../src/lib/feed/commonalities";

const A = "lucas";
const B = "beatriz";
const C = "rafael";
const DB_KEY = demoSocialStorageKey();

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
    keys: () => [...data.keys()],
  } as MemoryStorage;
}

function installBrowser(storage: MemoryStorage = createMemoryStorage()): MemoryStorage {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  return storage;
}

function reloadContext(): void {
  const current = window.localStorage as MemoryStorage;
  const next = createMemoryStorage();
  for (const key of current.keys()) {
    const value = current.getItem(key);
    if (value != null) next.setItem(key, value);
  }
  installBrowser(next);
}

beforeEach(() => {
  installBrowser();
});

describe("Fase 1D-2 — convites direcionais e persistentes", () => {
  test("usa as fontes canônicas locais existentes", () => {
    expect(DB_KEY).toBe("connexy:demo:db");
    expect(chatPersistenceSchema.name).toBe("connexy-app-local-db");
    expect(chatPersistenceSchema.stores.map((store) => store.name).sort()).toEqual([
      "conversations",
      "messages",
    ]);
  });

  test("A envia convite persistido para B sem recebê-lo de volta", () => {
    const request = sendRequest(A, B, "Olá, gostaria de conversar.");
    expect(request.fromUserId).toBe(A);
    expect(request.toUserId).toBe(B);
    expect(request.status).toBe("pending");
    expect(getPendingRequests(A)).toEqual([]);
    expect(getPendingRequests(B)).toEqual([request]);
    expect(getPendingRequests(C)).toEqual([]);

    reloadContext();
    expect(getIncomingPendingRequest(A, B)).toEqual(request);
    expect(getOutgoingPendingRequest(A, B)).toEqual(request);
    expect(getPendingRequests(B)).toHaveLength(1);
  });

  test("reenviar o mesmo convite atualiza sem duplicar", () => {
    const first = sendRequest(A, B, "Primeira mensagem");
    const second = sendRequest(A, B, "Mensagem atualizada");
    expect(second.id).toBe(first.id);
    expect(second.message).toBe("Mensagem atualizada");
    expect(getPendingRequests(B)).toHaveLength(1);
  });

  test("convite pendente atualiza o estado social sem fonte paralela", () => {
    expect(shouldShowNearbyPerson(B)).toBe(true);
    sendRequest(A, B, "Vamos conversar?");
    expect(shouldShowNearbyPerson(B)).toBe(false);
    expect((window.localStorage as MemoryStorage).keys()).toEqual([DB_KEY]);
    expect(window.localStorage.getItem("connexy.mock.conversation-invites")).toBeNull();
  });

  test("recusa é direcionada e permite reenvio idempotente", () => {
    const first = sendRequest(A, B, "Convite");
    declineRequest(A, B);
    expect(getRequestBetween(A, B)?.status).toBe("declined");
    expect(getPendingRequests(B)).toEqual([]);

    const resent = sendRequest(A, B, "Novo convite");
    expect(resent.id).toBe(first.id);
    expect(resent.status).toBe("pending");
    expect(getPendingRequests(B)).toHaveLength(1);
  });
});

describe("Fase 1D-2 — aceite, conexão e conversa", () => {
  test("B aceita e a conexão fica disponível para ambos, não para C", async () => {
    sendRequest(A, B, "Convite");
    const connection = await acceptRequest(A, B);
    expect(getRequestBetween(A, B)?.status).toBe("accepted");
    expect(getPendingRequests(B)).toEqual([]);
    expect(getConnectionBetween(A, B)).toEqual(connection);
    expect(isConnected(B, A)).toBe(true);
    expect(isConnected(A, B)).toBe(true);
    expect(isConnected(C, A)).toBe(false);
    expect(connection.conversationId).toContain(A);
    expect(connection.conversationId).toContain(B);

    reloadContext();
    expect(getConnectionBetween(A, B)).toEqual(connection);
    expect(getConnectionsCount(A)).toBe(1);
    expect(getConnectionsCount(B)).toBe(1);
  });

  test("aceite e criação repetidos não duplicam conexão ou conversa", async () => {
    sendRequest(A, B, "Convite");
    const first = await acceptRequest(A, B);
    const second = await acceptRequest(A, B);
    const compatibility = await connectUser(B, A);
    const afterConnection = sendRequest(A, B, "Não deve reabrir");
    expect(second).toEqual(first);
    expect(compatibility).toEqual(first);
    expect(afterConnection.status).toBe("accepted");
    expect(getPendingRequests(B)).toEqual([]);
    expect(getConnectionsCount(A)).toBe(1);
    expect(getConnectionsCount(B)).toBe(1);
  });

  test("normaliza conexão e solicitação legadas sem apagar dados", () => {
    window.localStorage.setItem(
      DB_KEY,
      JSON.stringify({
        connections: [{ userId: B, connectedAt: 123 }],
        requests: [
          {
            id: "legacy-request",
            fromUserId: C,
            message: "Legado",
            status: "pending",
            createdAt: 456,
          },
        ],
        messages: [],
        groups: [],
      }),
    );

    expect(getConnectionBetween(A, B)).toMatchObject({
      userAId: A,
      userBId: B,
      conversationId: B,
      connectedAt: 123,
    });
    expect(getPendingRequests(A)[0]).toMatchObject({
      id: "legacy-request",
      fromUserId: C,
      toUserId: A,
      message: "Legado",
    });
  });
});
