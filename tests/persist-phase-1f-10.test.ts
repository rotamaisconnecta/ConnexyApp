import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { acceptRequest, sendLocalMessage, sendRequest } from "../src/lib/demo/demo-db";
import { clearLocalChat, getLocalChatMessages } from "../src/lib/chat/local-chat-persistence";
import { chatPersistenceSchema } from "../src/lib/persistence/domain/chat-schema";
import { StoredMessageKind } from "../src/lib/persistence/domain/chat-entities";
import { MessageKind } from "../src/lib/chat/chat-types";
import {
  DEMO_CALL_FEEDBACK,
  clearDemoCallSession,
  connectDemoCall,
  finishDemoCall,
  formatDemoCallRecord,
  getDemoCallSession,
  missDemoCall,
  startDemoCall,
  triggerDemoCallFeedback,
} from "../src/lib/chat/demo-call";

const A = "lucas";
const B = "beatriz";
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

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

async function connectedConversation() {
  sendRequest(A, B, "Vamos conversar na 1F-10");
  const connection = await acceptRequest(A, B);
  return connection;
}

beforeEach(async () => {
  installBrowser();
  clearDemoCallSession();
  await clearLocalChat();
});

describe("Fase 1F-10 — infraestrutura existente, sem WebRTC paralelo", () => {
  test("reutiliza mensagens/conversas e mantém o aviso honesto da 1A", async () => {
    expect(chatPersistenceSchema.name).toBe("connexy-app-local-db");
    expect(chatPersistenceSchema.stores.map((store) => store.name).sort()).toEqual([
      "conversations",
      "messages",
    ]);
    expect(Object.values(StoredMessageKind)).toEqual([
      "text",
      "event",
      "location",
      "image",
      "video",
      "audio",
      "file",
    ]);
    expect(Object.values(MessageKind)).not.toContain("call");

    const messages: string[] = [];
    triggerDemoCallFeedback((message) => messages.push(message));
    expect(messages).toEqual([DEMO_CALL_FEEDBACK]);
    expect(DEMO_CALL_FEEDBACK.toLowerCase()).not.toContain("chamada iniciada");
    expect(DEMO_CALL_FEEDBACK.toLowerCase()).not.toContain("em ligação");

    const screen = await source("src/components/chat/ConnexyChatScreen.tsx");
    expect(screen).toContain("startDemoCall");
    expect(screen).toContain("DemoCallOverlay");
    expect(screen).toContain('beginDemoCall("voice")');
    expect(screen).toContain('beginDemoCall("video")');
    expect(screen).toContain("group ||");
    expect(screen).toContain("triggerDemoCallFeedback");
    expect(screen).not.toContain("RTCPeerConnection");
    expect(screen).not.toContain('toast.info("Videocall em breve")');

    const moduleSource = await source("src/lib/chat/demo-call.ts");
    expect(moduleSource).toContain("sendLocalMessage");
    expect(moduleSource).not.toContain("RTCPeerConnection");
    expect(moduleSource).not.toContain("getUserMedia");
    expect(moduleSource).not.toContain("indexedDB");
    expect(moduleSource).not.toContain("localStorage");

    const overlay = await source("src/components/chat/demo-call-overlay.tsx");
    expect(overlay).toContain("DEMO_CALL_FEEDBACK");
    expect(overlay).toContain("data-demo-call-overlay");
    expect(overlay).not.toContain("RTCPeerConnection");
    expect(overlay).not.toContain("getUserMedia");
  });
});

describe("Fase 1F-10 — voz no Chat", () => {
  test("inicia, atende, recusa, perde e encerra com IDs canônicos", async () => {
    const connection = await connectedConversation();
    expect(
      startDemoCall({ conversationId: "", callerId: A, calleeId: B, media: "voice" }),
    ).toBeNull();
    expect(
      startDemoCall({
        conversationId: connection.conversationId,
        callerId: A,
        calleeId: A,
        media: "voice",
      }),
    ).toBeNull();

    const outgoing = startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "voice",
    });
    expect(outgoing).toMatchObject({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "voice",
      status: "outgoing",
    });
    expect(
      startDemoCall({
        conversationId: connection.conversationId,
        callerId: A,
        calleeId: B,
        media: "video",
      })?.id,
    ).toBe(outgoing?.id);

    expect(connectDemoCall(outgoing?.id).status).toBe("connected");
    const ended = finishDemoCall("ended", { id: A, name: "Lucas" });
    expect(ended?.conversationId).toBe(connection.conversationId);
    expect(ended?.senderId).toBe(A);
    expect(ended?.text).toBe(formatDemoCallRecord("voice", "ended"));
    expect(getDemoCallSession()).toBeNull();

    const declinedSession = startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "voice",
    });
    expect(declinedSession?.status).toBe("outgoing");
    const declined = finishDemoCall("declined", { id: A, name: "Lucas" });
    expect(declined?.text).toBe(formatDemoCallRecord("voice", "declined"));

    const missedSession = startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "voice",
    });
    expect(missedSession?.calleeId).toBe(B);
    const missed = missDemoCall({ id: A, name: "Lucas" });
    expect(missed?.text).toBe(formatDemoCallRecord("voice", "missed"));

    const texts = getLocalChatMessages(connection.conversationId).map((message) => message.text);
    expect(texts).toEqual([
      formatDemoCallRecord("voice", "ended"),
      formatDemoCallRecord("voice", "declined"),
      formatDemoCallRecord("voice", "missed"),
    ]);
  });
});

describe("Fase 1F-10 — vídeo no Chat", () => {
  test("inicia, atende, recusa, perde e encerra sem MediaStream", async () => {
    const connection = await connectedConversation();
    const outgoing = startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "video",
    });
    expect(outgoing?.media).toBe("video");
    expect(connectDemoCall()?.status).toBe("connected");
    expect(finishDemoCall("ended", { id: A, name: "Lucas" })?.text).toBe(
      formatDemoCallRecord("video", "ended"),
    );

    startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "video",
    });
    expect(finishDemoCall("declined", { id: A, name: "Lucas" })?.text).toBe(
      formatDemoCallRecord("video", "declined"),
    );

    startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "video",
    });
    expect(missDemoCall({ id: A, name: "Lucas" })?.text).toBe(
      formatDemoCallRecord("video", "missed"),
    );

    const texts = getLocalChatMessages(connection.conversationId).map((message) => message.text);
    expect(texts).toEqual([
      formatDemoCallRecord("video", "ended"),
      formatDemoCallRecord("video", "declined"),
      formatDemoCallRecord("video", "missed"),
    ]);
  });
});

describe("Fase 1F-10 — conversa e recovery", () => {
  test("mensagens existentes continuam e só o estado final sobrevive ao fim da sessão", async () => {
    const connection = await connectedConversation();
    sendLocalMessage(connection.conversationId, "me", "Mensagem funcional 1F-10", {
      id: A,
      name: "Lucas",
    });
    startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "voice",
    });
    connectDemoCall();
    finishDemoCall("ended", { id: A, name: "Lucas" });

    const before = getLocalChatMessages(connection.conversationId).map((message) => message.text);
    expect(before).toEqual(["Mensagem funcional 1F-10", formatDemoCallRecord("voice", "ended")]);

    startDemoCall({
      conversationId: connection.conversationId,
      callerId: A,
      calleeId: B,
      media: "video",
    });
    expect(getDemoCallSession()?.status).toBe("outgoing");
    clearDemoCallSession();
    expect(getDemoCallSession()).toBeNull();
    expect(getLocalChatMessages(connection.conversationId).map((message) => message.text)).toEqual(
      before,
    );
    expect(window.localStorage.getItem("connexy:demo:calls")).toBeNull();
    expect(window.localStorage.getItem("connexy_demo_call")).toBeNull();
  });
});
