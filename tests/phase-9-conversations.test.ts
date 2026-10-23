import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  acceptRequest,
  getConnectionBetween,
  getMessages,
  getPendingRequests,
  sendLocalMessage,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { listFunctionalDemoConversations } from "../src/lib/chat/functional-conversation-list";
import { listLocalInboxItems } from "../src/lib/notifications/local-invite-inbox";
import { getLocalConversation } from "../src/lib/chat/local-chat-persistence";
import { people } from "../src/lib/mock-data";

const A = "lucas";
const B = "beatriz";
const projectRoot = join(import.meta.dir, "..");

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
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
  return storage;
}

beforeEach(() => installBrowser());

describe("Fase 9 — cenário funcional mínimo", () => {
  test("descoberta → quero conversar → notificação → aceite → conversa → mensagem", async () => {
    expect(people.some((item) => item.id === B)).toBe(true);

    sendRequest(A, B, "Vamos conversar?");

    expect(getPendingRequests(B)).toHaveLength(1);
    expect(getPendingRequests(B)[0]?.fromUserId).toBe(A);
    const inbox = listLocalInboxItems(B);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.kind).toBe("conversation_invite");

    const connection = await acceptRequest(A, B);
    expect(connection.conversationId).toBe(`demo-direct-${[A, B].sort().join("--")}`);
    expect(getPendingRequests(B)).toEqual([]);
    expect(await getLocalConversation(connection.conversationId)).not.toBeNull();

    const again = await acceptRequest(A, B);
    expect(again.conversationId).toBe(connection.conversationId);

    const inviteButtonPath = getConnectionBetween(B, A)?.conversationId ?? B;
    expect(inviteButtonPath).toBe(connection.conversationId);
    const acceptancePath = getConnectionBetween(A, B)?.conversationId ?? A;
    expect(acceptancePath).toBe(connection.conversationId);

    expect(
      listFunctionalDemoConversations(B).some((item) => item.id === connection.conversationId),
    ).toBe(true);

    sendLocalMessage(connection.conversationId, "me", "Oi, tudo bem?", {
      id: B,
      name: people.find((item) => item.id === B)?.name ?? "B",
    });

    const forA = listFunctionalDemoConversations(A).find(
      (item) => item.id === connection.conversationId,
    );
    const forB = listFunctionalDemoConversations(B).find(
      (item) => item.id === connection.conversationId,
    );
    expect(forA?.lastMessage).toBe("Oi, tudo bem?");
    expect(forA?.unreadCount).toBe(1);
    expect(forB?.lastMessage).toBe("Oi, tudo bem?");
    expect(forB?.unreadCount).toBe(0);

    sendLocalMessage(connection.conversationId, "me", "Tudo sim!", {
      id: A,
      name: people.find((item) => item.id === A)?.name ?? "A",
    });
    const forA2 = listFunctionalDemoConversations(A).find(
      (item) => item.id === connection.conversationId,
    );
    const forB2 = listFunctionalDemoConversations(B).find(
      (item) => item.id === connection.conversationId,
    );
    expect(forA2?.lastMessage).toBe("Tudo sim!");
    expect(forA2?.unreadCount).toBe(0);
    expect(forB2?.unreadCount).toBe(1);

    expect(getMessages(connection.conversationId).map((item) => item.text)).toEqual([
      "Oi, tudo bem?",
      "Tudo sim!",
    ]);
  });

  test("mensagem sem senderId ainda conta como não lida para quem recebeu", async () => {
    const connection = await (async () => {
      sendRequest(A, B, "Oi");
      return acceptRequest(A, B);
    })();
    sendLocalMessage(connection.conversationId, "them", "Sem senderId", undefined);
    const row = listFunctionalDemoConversations(A).find(
      (item) => item.id === connection.conversationId,
    );
    expect(row?.unreadCount).toBe(1);
  });
});

describe("Fase 9 — superfícies de navegação e IA (inspeção de código)", () => {
  async function source(relativePath: string) {
    return readFile(join(projectRoot, relativePath), "utf8");
  }

  test("aceite e convites abrem a mesma rota de conversa", async () => {
    const solicitacao = await source("src/routes/_app.solicitacao.$id.tsx");
    expect(solicitacao).toContain('to: "/chat/$conversationId"');
    expect(solicitacao).toContain("connection.conversationId");
    expect(solicitacao).toContain("getConnectionBetween");

    const invite = await source("src/components/chat/conversation-invite-button.tsx");
    expect(invite).toContain("getConnectionBetween");
    expect(invite).toContain('to: "/chat/$conversationId"');

    const notifications = await source("src/routes/_app.notificacoes.tsx");
    expect(notifications).toContain('to: "/solicitacao/$id"');
    expect(notifications).toContain('to: "/chat/$conversationId"');

    const list = await source("src/components/chat/conversations-screen.tsx");
    expect(list).toContain('to: "/chat/$conversationId"');
    expect(list).toContain("listFunctionalDemoConversations");

    const chat = await source("src/components/chat/ConnexyChatScreen.tsx");
    expect(chat).toContain('router.navigate({ to: "/chat" })');
    expect(chat).toContain("ensureLocalConversation");
  });

  test("primeiro contato e sugestão de conversa seguem dentro do fluxo", async () => {
    const chat = await source("src/components/chat/ConnexyChatScreen.tsx");
    expect(chat).toContain('mode="conversations"');
    expect(chat).toContain("onInsertSuggestion");
    expect(chat).not.toContain("onCreateMedia");

    const assistant = await source("src/components/ai/connexy-ai-assistant.tsx");
    expect(assistant).toContain("O que você deseja?");
    expect(assistant).toContain("Sugestão de conversa");
    expect(assistant).toContain("Criar mídia");
  });

  test("não existe rota paralela de conversa", async () => {
    const routeTree = await source("src/routeTree.gen.ts");
    expect(routeTree).toContain("'/chat'");
    expect(routeTree).toContain("'/chat/$conversationId'");
    expect(routeTree).not.toContain("'/conversas");
  });
});
