import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  acceptRequest,
  createDemoGroup,
  declineRequest,
  demoSocialStorageKey,
  getPendingRequests,
  respondToDemoGroupInvite,
  sendLocalMessage,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { listFunctionalDemoConversations } from "../src/lib/chat/functional-conversation-list";
import { MOCK_CONVERSATIONS } from "../src/lib/chat/mock-conversations";
import { listLocalInboxItems } from "../src/lib/notifications/local-invite-inbox";
import { matchesConnectaListFilter } from "../src/lib/discovery/connecta-list-filter";
import { people } from "../src/lib/mock-data";
import { chatPersistenceSchema } from "../src/lib/persistence/domain/chat-schema";

const A = "lucas";
const B = "beatriz";
const C = "rafael";
const DB_KEY = demoSocialStorageKey();
const projectRoot = join(import.meta.dir, "..");

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(seed?: Map<string, string>): MemoryStorage {
  const data = seed ? new Map(seed) : new Map<string, string>();
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
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
  return storage;
}

function reloadContext(): MemoryStorage {
  const current = (globalThis as { window?: { localStorage: MemoryStorage } }).window?.localStorage;
  const snapshot = new Map<string, string>();
  if (current) {
    for (const key of current.keys()) {
      const value = current.getItem(key);
      if (value != null) snapshot.set(key, value);
    }
  }
  return installBrowser(createMemoryStorage(snapshot));
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function person(id: string) {
  const found = people.find((item) => item.id === id);
  if (!found) throw new Error(`pessoa ${id} ausente do catálogo`);
  return found;
}

beforeEach(() => {
  installBrowser();
});

describe("Fase 1F-5 — Connecta / Solicitações", () => {
  test("aba Solicitações usa getPendingRequests e o filtro passa a ter efeito", async () => {
    const page = await source("src/routes/_app.connecta.tsx");
    expect(page).toContain("useDemoPendingRequests");
    expect(page).toContain('tab === "solicitacoes"');
    expect(page).toContain("matchesConnectaListFilter");
    expect(page).toContain("data-connecta-filter");
    expect(page).toContain('to: "/solicitacao/$id"');
    expect(page).not.toContain("acceptRequest");
    expect(page).not.toContain("declineRequest");
    expect(page).not.toContain("indexedDB");
    expect(page).not.toContain(".from(");
  });

  test("solicitação pendente aparece, não duplica e o filtro distingue catálogo", () => {
    const first = sendRequest(B, A, "Oi, Lucas, vamos conversar?");
    const second = sendRequest(B, A, "Oi de novo");
    expect(second.id).toBe(first.id);
    expect(getPendingRequests(A)).toHaveLength(1);
    expect(getPendingRequests(A)[0]?.fromUserId).toBe(B);
    expect(getPendingRequests(B)).toEqual([]);

    expect(
      matchesConnectaListFilter(person("beatriz"), { onlyOnline: true, onlyNearby: true }),
    ).toBe(true);
    expect(
      matchesConnectaListFilter(person("carlos"), { onlyOnline: true, onlyNearby: false }),
    ).toBe(false);
    expect(
      matchesConnectaListFilter(person("marina"), { onlyOnline: false, onlyNearby: true }),
    ).toBe(false);
  });

  test("aceitar e recusar usam os handlers existentes e sobrevivem ao reload", async () => {
    sendRequest(B, A, "Convite para aceitar");
    expect(getPendingRequests(A)).toHaveLength(1);
    await acceptRequest(B, A);
    expect(getPendingRequests(A)).toEqual([]);
    reloadContext();
    expect(getPendingRequests(A)).toEqual([]);

    sendRequest(C, A, "Convite para recusar");
    expect(getPendingRequests(A)).toHaveLength(1);
    declineRequest(C, A);
    expect(getPendingRequests(A)).toEqual([]);
    reloadContext();
    expect(getPendingRequests(A)).toEqual([]);
    expect((window.localStorage as MemoryStorage).keys().filter((key) => key === DB_KEY)).toEqual([
      DB_KEY,
    ]);
  });
});

describe("Fase 1F-5 — Conversas sem mistura de MOCK_CONVERSATIONS", () => {
  test("a lista funcional não importa o catálogo morto", async () => {
    const screen = await source("src/components/chat/conversations-screen.tsx");
    expect(screen).toContain("listFunctionalDemoConversations");
    expect(screen).not.toContain("MOCK_CONVERSATIONS");
    expect(screen).not.toContain(".from(");
    const helper = await source("src/lib/chat/functional-conversation-list.ts");
    expect(helper).toContain("getConnectionsForUser");
    expect(helper).toContain("getLocalConversations");
    expect(helper).toContain("getDemoGroupsForUser");
    expect(helper).not.toContain("MOCK_CONVERSATIONS");
    expect(chatPersistenceSchema.stores.map((store) => store.name).sort()).toEqual([
      "conversations",
      "messages",
    ]);
  });

  test("conversa real aparece, mensagem atualiza e o catálogo mock não entra", async () => {
    expect(listFunctionalDemoConversations(A)).toEqual([]);
    sendRequest(A, B, "Vamos conversar?");
    const connection = await acceptRequest(A, B);
    const listed = listFunctionalDemoConversations(A);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(connection.conversationId);
    expect(listed[0]?.participant.id).toBe(B);
    expect(listed.map((item) => item.id)).not.toContain("beatriz");

    const mockIds = MOCK_CONVERSATIONS.map((item) => item.id);
    expect(listed.some((item) => mockIds.includes(item.id))).toBe(false);

    sendLocalMessage(connection.conversationId, "me", "Mensagem funcional 1F-5", {
      id: A,
      name: "Lucas",
    });
    expect(listFunctionalDemoConversations(A)[0]?.lastMessage).toBe("Mensagem funcional 1F-5");

    const again = await acceptRequest(A, B);
    expect(again.conversationId).toBe(connection.conversationId);
    expect(listFunctionalDemoConversations(A)).toHaveLength(1);

    reloadContext();
    expect(listFunctionalDemoConversations(A)).toHaveLength(1);
    expect(listFunctionalDemoConversations(A)[0]?.id).toBe(connection.conversationId);
  });
});

describe("Fase 1F-5 — Notificações sem catálogo morto", () => {
  test("a inbox funcional não renderiza o fixture de mock-data", async () => {
    const page = await source("src/routes/_app.notificacoes.tsx");
    expect(page).toContain("listLocalInboxItems");
    expect(page).not.toContain("import { notifications");
    expect(page).not.toContain("visibleNotifications");
    expect(page).not.toContain("Sunset no Parque");
    expect(page).not.toContain("Café Central");
    expect(page).not.toContain("Juliana aceitou");
    expect(page).not.toContain("markAsRead");
    expect(page).not.toContain("unreadCount");
    expect(page).not.toContain(".from(");
  });

  test("solicitação e convite de grupo projetam itens e saem após a ação", async () => {
    expect(listLocalInboxItems(A)).toEqual([]);
    const request = sendRequest(B, A, "Solicitação visível na inbox");
    expect(listLocalInboxItems(A)).toHaveLength(1);
    expect(listLocalInboxItems(A)[0]).toMatchObject({
      kind: "conversation_invite",
      requestId: request.id,
      fromUserId: B,
    });
    expect(listLocalInboxItems(A).some((item) => item.id === "n1")).toBe(false);

    await acceptRequest(B, A);
    expect(listLocalInboxItems(A)).toEqual([]);

    sendRequest(A, C, "Base para grupo");
    const connection = await acceptRequest(A, C);
    const group = createDemoGroup(connection.conversationId, A, [C], "Grupo 1F-5");
    expect(listLocalInboxItems(C).filter((item) => item.kind === "group_invite")).toHaveLength(1);
    expect(listLocalInboxItems(C)[0]).toMatchObject({
      kind: "group_invite",
      groupId: group.id,
      name: "Grupo 1F-5",
    });
    respondToDemoGroupInvite(group.id, C, false);
    expect(listLocalInboxItems(C).filter((item) => item.kind === "group_invite")).toEqual([]);

    reloadContext();
    expect(listLocalInboxItems(C)).toEqual([]);
    expect(window.localStorage.getItem("connexy.mock.conversation-invites")).toBeNull();
  });
});
