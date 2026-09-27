import { beforeEach, describe, expect, test } from "bun:test";
import { PersistenceError, PersistenceErrorCode } from "../src/lib/persistence/errors";
import type { EntityId } from "../src/lib/persistence/types";
import {
  chatPersistenceSchema,
  CONVERSATION_STORE,
  MESSAGE_INDEX_CONVERSATION,
  MESSAGE_STORE,
} from "../src/lib/persistence/domain/chat-schema";
import type {
  StoredConversation,
  StoredMessage,
} from "../src/lib/persistence/domain/chat-entities";
import { ConversationRepository } from "../src/repositories/conversation.repository";
import { MessageRepository } from "../src/repositories/message.repository";

type Disk = Map<EntityId, unknown>;

function memoryDisk(): Map<string, Map<EntityId, unknown>> {
  return new Map([
    [CONVERSATION_STORE, new Map()],
    [MESSAGE_STORE, new Map()],
  ]);
}

function memoryAdapter(
  disk: Map<string, Map<EntityId, unknown>>,
  failOn?: (operation: string) => boolean,
) {
  return {
    schema: chatPersistenceSchema,
    async get(store: string, id: string) {
      return disk.get(store)?.get(id) ?? null;
    },
    async getAll(store: string) {
      return [...(disk.get(store)?.values() ?? [])];
    },
    async getAllKeys(store: string) {
      return [...(disk.get(store)?.keys() ?? [])];
    },
    async getAllByIndex(store: string, indexName: string, value: string | number) {
      if (failOn?.("getAllByIndex")) {
        throw new PersistenceError("getAllByIndex falhou (injetado)", PersistenceErrorCode.UNKNOWN);
      }
      const storeDef = chatPersistenceSchema.stores.find((item) => item.name === store);
      const indexDef = storeDef?.indexes?.find((item) => item.name === indexName);
      const keyPath = typeof indexDef?.keyPath === "string" ? indexDef.keyPath : null;
      const rows = [...(disk.get(store)?.values() ?? [])];
      if (!keyPath) return rows;
      return rows.filter((row) => (row as Record<string, unknown>)[keyPath] === value);
    },
    async put(store: string, value: { id: string }) {
      if (failOn?.("put")) {
        throw new PersistenceError("put falhou (injetado)", PersistenceErrorCode.UNKNOWN);
      }
      let map = disk.get(store);
      if (!map) {
        map = new Map();
        disk.set(store, map);
      }
      map.set(value.id, value);
    },
    async delete(store: string, id: string) {
      if (failOn?.("delete")) {
        throw new PersistenceError("delete falhou (injetado)", PersistenceErrorCode.UNKNOWN);
      }
      disk.get(store)?.delete(id);
    },
    async clear(store: string) {
      disk.set(store, new Map());
    },
    async close() {},
  };
}

function makeMessage(id: string, conversationId: string, at: number, text = "olá"): StoredMessage {
  return { id, conversationId, from: "me", text, at };
}

function makeConversation(id: string, updatedAt: number): StoredConversation {
  return {
    id,
    createdAt: updatedAt,
    updatedAt,
    lastMessageText: null,
    lastMessageType: null,
  };
}

let disk: ReturnType<typeof memoryDisk>;

beforeEach(() => {
  disk = memoryDisk();
});

describe("Fase 1C-2 — ConversationRepository", () => {
  test("cria (ensureExists), obtém e verifica existência", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    const created = await repo.ensureExists("ana", 1000);

    expect(created.id).toBe("ana");
    expect(created.createdAt).toBe(1000);
    expect(created.lastMessageText).toBeNull();
    expect(await repo.get("ana")).toEqual(created);
    expect(await repo.exists("ana")).toBe(true);
  });

  test("ensureExists é idempotente (não recria/duplica)", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    const first = await repo.ensureExists("ana", 1000);
    const second = await repo.ensureExists("ana", 99999);

    expect(second.id).toBe("ana");
    expect(second.createdAt).toBe(1000);
    expect(await repo.list()).toHaveLength(1);
  });

  test("lista conversas", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    await repo.put(makeConversation("ana", 100));
    await repo.put(makeConversation("bia", 300));

    const list = await repo.list();
    expect(list.map((c) => c.id).sort()).toEqual(["ana", "bia"]);
  });

  test("aplica último conteúdo sem duplicar mensagens (não é dual-write)", async () => {
    const conversations = new ConversationRepository(memoryAdapter(disk));
    const messages = new MessageRepository(memoryAdapter(disk));
    const message = { ...makeMessage("m1", "ana", 500), text: "última", kind: "text" as const };

    await messages.put({
      id: message.id,
      conversationId: message.conversationId,
      from: message.from,
      text: message.text,
      at: message.at,
    });
    const updated = await conversations.applyLastMessage("ana", message);

    expect(updated.updatedAt).toBe(500);
    expect(updated.lastMessageText).toBe("última");
    expect(updated.lastMessageType).toBe("text");
    expect(await messages.list()).toHaveLength(1);
    expect(await conversations.list()).toHaveLength(1);
    expect((await conversations.list())[0].id).toBe("ana");
  });

  test("aplica último conteúdo a conversa inexistente (cria o agregado)", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    const updated = await repo.applyLastMessage("novo", { at: 700, text: "oi", kind: "image" });

    expect(updated.id).toBe("novo");
    expect(updated.createdAt).toBe(700);
    expect(updated.lastMessageType).toBe("image");
  });

  test("listOrderedByUpdatedAt ordena por atividade (mais recente primeiro)", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    await repo.put(makeConversation("ana", 100));
    await repo.put(makeConversation("bia", 900));
    await repo.put(makeConversation("cel", 300));

    const ordered = await repo.listOrderedByUpdatedAt();
    expect(ordered.map((c) => c.id)).toEqual(["bia", "cel", "ana"]);
  });

  test("obtém null para conversa inexistente", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    expect(await repo.get("nao-existe")).toBeNull();
    expect(await repo.exists("nao-existe")).toBe(false);
  });

  test("atualiza conversa preservando o id", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    await repo.put(makeConversation("ana", 100));
    const updated = await repo.update("ana", { lastMessageText: "oi!", updatedAt: 500 });

    expect(updated.id).toBe("ana");
    expect(updated.lastMessageText).toBe("oi!");
    expect(updated.updatedAt).toBe(500);
  });

  test("update de conversa inexistente lança PersistenceError NOT_FOUND", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    try {
      await repo.update("ausente", { lastMessageText: "x" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.NOT_FOUND);
    }
  });

  test("exclui conversa", async () => {
    const repo = new ConversationRepository(memoryAdapter(disk));
    await repo.put(makeConversation("ana", 100));
    await repo.delete("ana");
    expect(await repo.get("ana")).toBeNull();
    expect(await repo.list()).toHaveLength(0);
  });
});

describe("Fase 1C-2 — MessageRepository", () => {
  test("cria, obtém e verifica existência", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    const message = makeMessage("m1", "ana", 100);
    await repo.put(message);

    expect(await repo.get("m1")).toEqual(message);
    expect(await repo.exists("m1")).toBe(true);
  });

  test("lista mensagens de uma conversa em ordem cronológica", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    // inseridas fora de ordem
    await repo.put(makeMessage("m3", "ana", 300));
    await repo.put(makeMessage("m1", "ana", 100));
    await repo.put(makeMessage("m2", "ana", 200));

    const list = await repo.listByConversation("ana");
    expect(list.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  test("lastInConversation retorna a mais recente", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    await repo.put(makeMessage("m1", "ana", 100));
    await repo.put(makeMessage("m2", "ana", 200));

    expect((await repo.lastInConversation("ana"))?.id).toBe("m2");
  });

  test("obtém null para mensagem inexistente", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    expect(await repo.get("nao-existe")).toBeNull();
    expect(await repo.exists("nao-existe")).toBe(false);
    expect(await repo.listByConversation("vazia")).toEqual([]);
    expect(await repo.lastInConversation("vazia")).toBeNull();
  });

  test("atualiza mensagem preservando id e conversationId", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    await repo.put(makeMessage("m1", "ana", 100, "primeira"));
    const updated = await repo.update("m1", { text: "editada" });

    expect(updated.id).toBe("m1");
    expect(updated.conversationId).toBe("ana");
    expect(updated.text).toBe("editada");
  });

  test("update de mensagem inexistente lança PersistenceError NOT_FOUND", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    try {
      await repo.update("ausente", { text: "x" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.NOT_FOUND);
    }
  });

  test("exclui mensagem", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    await repo.put(makeMessage("m1", "ana", 100));
    await repo.delete("m1");
    expect(await repo.get("m1")).toBeNull();
  });
});

describe("Fase 1C-2 — relacionamento Conversation → Message", () => {
  test("mensagens pertencem à conversa correta", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    await repo.put(makeMessage("a1", "ana", 100));
    await repo.put(makeMessage("a2", "ana", 200));
    await repo.put(makeMessage("b1", "bia", 150));

    const ana = await repo.listByConversation("ana");
    const bia = await repo.listByConversation("bia");

    expect(ana.every((m) => m.conversationId === "ana")).toBe(true);
    expect(bia.every((m) => m.conversationId === "bia")).toBe(true);
  });

  test("mensagens de uma conversa não aparecem em outra", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    await repo.put(makeMessage("a1", "ana", 100));
    await repo.put(makeMessage("b1", "bia", 200));

    const anaIds = (await repo.listByConversation("ana")).map((m) => m.id);
    const biaIds = (await repo.listByConversation("bia")).map((m) => m.id);

    expect(anaIds).toEqual(["a1"]);
    expect(biaIds).toEqual(["b1"]);
    expect(anaIds).not.toContain("b1");
    expect(biaIds).not.toContain("a1");
  });

  test("o índice usado é by_conversation sobre conversationId", () => {
    const storeDef = chatPersistenceSchema.stores.find((s) => s.name === MESSAGE_STORE);
    const index = storeDef?.indexes?.find((i) => i.name === MESSAGE_INDEX_CONVERSATION);
    expect(index).toBeDefined();
    expect(index?.keyPath).toBe("conversationId");
  });
});

describe("Fase 1C-2 — persistência entre instâncias (reload conceitual)", () => {
  test("mensagens sobrevivem a nova instância do adapter/repository", async () => {
    const firstRepo = new MessageRepository(memoryAdapter(disk));
    const message = makeMessage("m1", "ana", 100);
    await firstRepo.put(message);

    const secondRepo = new MessageRepository(memoryAdapter(disk));
    expect(await secondRepo.get("m1")).toEqual(message);
    expect(await secondRepo.listByConversation("ana")).toEqual([message]);
  });

  test("conversas sobrevivem a nova instância do adapter/repository", async () => {
    const firstRepo = new ConversationRepository(memoryAdapter(disk));
    await firstRepo.put(makeConversation("ana", 100));

    const secondRepo = new ConversationRepository(memoryAdapter(disk));
    expect(await secondRepo.get("ana")).toEqual(makeConversation("ana", 100));
    expect(await secondRepo.exists("ana")).toBe(true);
  });

  test("cenário completo: salvar → destruir → recriar → recuperar (mensagens + conversa)", async () => {
    const messages = new MessageRepository(memoryAdapter(disk));
    const conversations = new ConversationRepository(memoryAdapter(disk));

    const base = makeMessage("m1", "ana", 100);
    await messages.put(base);
    await conversations.applyLastMessage("ana", base);

    // "reload": novas instâncias com o mesmo disco
    const messagesReloaded = new MessageRepository(memoryAdapter(disk));
    const conversationsReloaded = new ConversationRepository(memoryAdapter(disk));

    expect(await messagesReloaded.listByConversation("ana")).toEqual([base]);
    const conversation = await conversationsReloaded.get("ana");
    expect(conversation?.id).toBe("ana");
    expect(conversation?.lastMessageText).toBe(base.text);
    expect(conversation?.updatedAt).toBe(base.at);
  });

  test("integridade: ids e conversationId são preservados ao longo do ciclo", async () => {
    const repo = new MessageRepository(memoryAdapter(disk));
    const ids = ["m1", "m2", "m3"];
    for (const id of ids) await repo.put(makeMessage(id, "ana", 100));

    const reloaded = new MessageRepository(memoryAdapter(disk));
    const stored = await reloaded.listByConversation("ana");
    expect(stored.map((m) => m.id).sort()).toEqual(ids);
    expect(stored.every((m) => m.conversationId === "ana")).toBe(true);
  });
});

describe("Fase 1C-2 — erros do adapter", () => {
  test("falha de escrita no adapter propaga PersistenceError identificável", async () => {
    const repo = new MessageRepository(memoryAdapter(disk, (op) => op === "put"));
    try {
      await repo.put(makeMessage("m1", "ana", 100));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.UNKNOWN);
    }
  });

  test("falha de consulta por índice propaga PersistenceError identificável", async () => {
    const repo = new MessageRepository(memoryAdapter(disk, (op) => op === "getAllByIndex"));
    try {
      await repo.listByConversation("ana");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe(PersistenceErrorCode.UNKNOWN);
    }
  });
});

describe("Fase 1C-2 — schema e isolamento", () => {
  test("schema cria apenas conversations e messages", () => {
    expect(chatPersistenceSchema.stores.map((s) => s.name).sort()).toEqual([
      CONVERSATION_STORE,
      MESSAGE_STORE,
    ]);
  });

  test("banco é independente do banco de Reels (nomes distintos)", () => {
    expect(chatPersistenceSchema.name).not.toContain("reels");
    expect(chatPersistenceSchema.name).toBe("connexy-app-local-db");
  });

  test("ConversationRepository escreve apenas na store de conversas", async () => {
    const conversations = new ConversationRepository(memoryAdapter(disk));
    const messages = new MessageRepository(memoryAdapter(disk));
    await conversations.ensureExists("ana", 100);

    expect(disk.get(MESSAGE_STORE)?.size ?? 0).toBe(0);
    expect(disk.get(CONVERSATION_STORE)?.size ?? 0).toBe(1);
    expect(await messages.list()).toHaveLength(0);
  });
});
