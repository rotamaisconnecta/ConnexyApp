import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextGesture } from "../src/lib/chat/mock-conversations";
import {
  deriveListGesture,
  isListGesture,
  isPinnedForUser,
  withPinnedUser,
} from "../src/lib/chat/conversation-list-state";
import { decorateFunctionalConversation } from "../src/lib/chat/functional-conversation-list";
import {
  clearLocalChat,
  getLocalConversation,
  markLocalListGestureHandled,
  setLocalConversationPinned,
} from "../src/lib/chat/local-chat-persistence";
import { MORE_MENU_LABELS } from "../src/lib/navigation/more-menu";
import { getDemoIdentity, setDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  DEFAULT_DEMO_SETTINGS,
  DEMO_SETTINGS_STORAGE_KEY,
  readDemoSettings,
  writeDemoSettings,
} from "../src/lib/demo/demo-settings";
import { ConversationRepository } from "../src/repositories/conversation.repository";
import {
  chatPersistenceSchema,
  CONVERSATION_STORE,
  MESSAGE_STORE,
} from "../src/lib/persistence/domain/chat-schema";
import type { StoredConversation, StoredMessage } from "../src/lib/persistence/domain/chat-entities";
import type { EntityId } from "../src/lib/persistence/types";
import { ThreadIcon } from "../src/lib/chat/mock-conversations";

const projectRoot = join(import.meta.dir, "..");
const A = "lucas";
const B = "beatriz";

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

function memoryDisk() {
  return new Map<string, Map<EntityId, unknown>>([
    [CONVERSATION_STORE, new Map()],
    [MESSAGE_STORE, new Map()],
  ]);
}

function memoryAdapter(disk: ReturnType<typeof memoryDisk>) {
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
    async getAllByIndex() {
      return [];
    },
    async put(store: string, value: { id: string }) {
      let map = disk.get(store);
      if (!map) {
        map = new Map();
        disk.set(store, map);
      }
      map.set(value.id, value);
    },
    async delete(store: string, id: string) {
      disk.get(store)?.delete(id);
    },
    async clear(store: string) {
      disk.set(store, new Map());
    },
    async close() {},
  };
}

function baseItem(id = "demo-direct-beatriz--lucas") {
  return {
    id,
    participant: { id: B, name: "Beatriz" },
    initials: "BE",
    isOnline: true,
    currentThread: "Conexão local",
    threadIcon: ThreadIcon.COFFEE,
    lastMessage: "oi",
    updatedAt: new Date(1_700_000_000_000),
    unreadCount: 0,
    isMuted: false,
  };
}

function lastMessage(overrides: Partial<StoredMessage> = {}): StoredMessage {
  return {
    id: "m1",
    conversationId: "demo-direct-beatriz--lucas",
    from: "them",
    senderId: B,
    text: "oi",
    at: 1_700_000_000_000,
    ...overrides,
  };
}

beforeEach(async () => {
  installBrowser();
  await clearLocalChat();
});

describe("Fase 1H-4 — Fixar conversa", () => {
  test("conversa começa solta, fixa, desfaz e isola por identidade", async () => {
    setDemoIdentity(A);
    const id = "demo-direct-beatriz--lucas";
    expect(getLocalConversation(id)?.pinnedByUserIds ?? []).toEqual([]);

    await setLocalConversationPinned(id, A, true);
    expect(isPinnedForUser(getLocalConversation(id)?.pinnedByUserIds, A)).toBe(true);
    expect(isPinnedForUser(getLocalConversation(id)?.pinnedByUserIds, B)).toBe(false);

    await setLocalConversationPinned(id, A, false);
    expect(isPinnedForUser(getLocalConversation(id)?.pinnedByUserIds, A)).toBe(false);
  });

  test("withPinnedUser não duplica e applyLastMessage preserva o pin", async () => {
    expect(withPinnedUser(["lucas"], A, true)).toEqual(["lucas"]);
    expect(withPinnedUser(["lucas"], B, true).sort()).toEqual(["beatriz", "lucas"]);
    expect(withPinnedUser(["lucas", "beatriz"], A, false)).toEqual(["beatriz"]);

    const disk = memoryDisk();
    const repo = new ConversationRepository(memoryAdapter(disk));
    const seeded: StoredConversation = {
      id: "ana",
      createdAt: 100,
      updatedAt: 100,
      lastMessageText: null,
      lastMessageType: null,
      pinnedByUserIds: [A],
    };
    await repo.put(seeded);
    const updated = await repo.applyLastMessage("ana", { at: 200, text: "nova", kind: "text" });
    expect(updated.pinnedByUserIds).toEqual([A]);
    expect(updated.lastMessageText).toBe("nova");
  });

  test("decorateFunctionalConversation reflete pin na lista", () => {
    const item = decorateFunctionalConversation(
      baseItem(),
      A,
      {
        id: baseItem().id,
        createdAt: 1,
        updatedAt: 1,
        lastMessageText: "oi",
        lastMessageType: "text",
        pinnedByUserIds: [A],
      },
      lastMessage(),
    );
    expect(item.isPinned).toBe(true);
    const other = decorateFunctionalConversation(
      baseItem(),
      B,
      {
        id: baseItem().id,
        createdAt: 1,
        updatedAt: 1,
        lastMessageText: "oi",
        lastMessageType: "text",
        pinnedByUserIds: [A],
      },
      lastMessage(),
    );
    expect(other.isPinned).toBe(false);
  });
});

describe("Fase 1H-4 — Ouvir / Confirmar / Retomar", () => {
  test("Ouvir aparece para último áudio e some depois da ação", async () => {
    const last = lastMessage({ kind: "audio", text: "áudio 0:08" });
    const before = decorateFunctionalConversation(baseItem(), A, undefined, last);
    expect(before.nextGesture).toBe(NextGesture.LISTEN);
    expect(isListGesture(before.nextGesture)).toBe(true);

    await markLocalListGestureHandled(baseItem().id, last.at + 1);
    const after = decorateFunctionalConversation(
      baseItem(),
      A,
      getLocalConversation(baseItem().id) ?? undefined,
      last,
    );
    expect(after.nextGesture).toBeUndefined();
  });

  test("Confirmar aparece para convite de horário e resolve sem abrir thread", async () => {
    const last = lastMessage({ text: "Confirmar reunião amanhã, 10h?" });
    const item = decorateFunctionalConversation(baseItem(), A, undefined, last);
    expect(item.nextGesture).toBe(NextGesture.CONFIRM);
    await markLocalListGestureHandled(item.id, last.at + 5);
    const resolved = decorateFunctionalConversation(
      baseItem(),
      A,
      getLocalConversation(item.id) ?? undefined,
      last,
    );
    expect(resolved.nextGesture).toBeUndefined();
  });

  test("Retomar aparece só em conversa parada do outro e some após a ação", async () => {
    const last = lastMessage({ text: "quando você puder", at: Date.now() - 9 * 60 * 60 * 1000 });
    const item = decorateFunctionalConversation(baseItem(), A, undefined, last);
    expect(item.nextGesture).toBe(NextGesture.RESUME);
    await markLocalListGestureHandled(item.id, Date.now());
    const resolved = decorateFunctionalConversation(
      baseItem(),
      A,
      getLocalConversation(item.id) ?? undefined,
      last,
    );
    expect(resolved.nextGesture).toBeUndefined();
  });

  test("deriveListGesture prioriza áudio e ignora mensagem própria para retomar", () => {
    expect(
      deriveListGesture({
        last: lastMessage({ kind: "audio", text: "áudio" }),
        viewerId: A,
      }),
    ).toBe(NextGesture.LISTEN);
    expect(
      deriveListGesture({
        last: lastMessage({ from: "me", senderId: A, text: "oi de novo" }),
        viewerId: A,
        now: Date.now(),
      }),
    ).toBeUndefined();
  });
});

describe("Fase 1H-4 — Settings locais", () => {
  test("preferências sobrevivem ao reload e isolam identidade", () => {
    setDemoIdentity(A);
    writeDemoSettings({ language: "English", twoFactor: true, payment: "Pix" }, A);
    expect(readDemoSettings(A)).toEqual({
      twoFactor: true,
      payment: "Pix",
      language: "English",
    });

    reloadContext();
    expect(readDemoSettings(A).language).toBe("English");
    expect(readDemoSettings(A).twoFactor).toBe(true);
    expect(readDemoSettings(B)).toEqual(DEFAULT_DEMO_SETTINGS);
    expect(localStorage.getItem(DEMO_SETTINGS_STORAGE_KEY)).toContain("lucas");
  });
});

describe("Fase 1H-4 — Corrida e regressão de fonte", () => {
  test("paradas mock saíram do fluxo visual e origem/destino permanecem", async () => {
    const panels = await readFile(
      join(projectRoot, "src/components/mobility/ride/ride-request-panels.tsx"),
      "utf8",
    );
    const flow = await readFile(join(projectRoot, "src/components/mobility/ride/ride-flow.tsx"), "utf8");
    const data = await readFile(join(projectRoot, "src/components/mobility/ride/ride-data.ts"), "utf8");
    const dispatcher = await readFile(
      join(projectRoot, "src/lib/mobility/dispatch/dispatcher.ts"),
      "utf8",
    );
    const trip = await readFile(join(projectRoot, "src/lib/mobility/trip/trip-store.ts"), "utf8");

    expect(panels).not.toContain("STOP_SUGGESTIONS");
    expect(panels).not.toContain("Padaria Bella Paulista");
    expect(panels).not.toContain("onAddSuggestion");
    expect(panels).toContain("onEditOrigin");
    expect(panels).toContain("destination");
    expect(panels).toContain("RideItineraryCard");
    const itinerary = await readFile(
      join(projectRoot, "src/components/mobility/ride/ride-itinerary.tsx"),
      "utf8",
    );
    expect(itinerary).toContain("Adicionar parada");
    expect(flow).toContain("RideMap");
    expect(flow).not.toContain("handleAddSuggestion");
    expect(data).not.toContain("STOP_SUGGESTIONS");
    expect(dispatcher).toContain("connexy_demo_dispatcher");
    expect(trip).toContain("connexy_demo_trip");
  });

  test("não cria store/repository paralelo e Menu Mais permanece", async () => {
    const persistence = await readFile(
      join(projectRoot, "src/lib/chat/local-chat-persistence.ts"),
      "utf8",
    );
    expect(persistence).toContain("setLocalConversationPinned");
    expect(persistence).toContain("markLocalListGestureHandled");
    expect(MORE_MENU_LABELS).toEqual(["Locais", "Eventos", "Negócios", "Agora", "Ofertas", "Gerenciar"]);
    const listed = new Bun.Glob("src/**/*Pinned*").scanSync({ cwd: projectRoot });
    expect([...listed]).toEqual([]);
  });
});
