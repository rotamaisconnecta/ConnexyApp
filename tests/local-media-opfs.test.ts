import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  __forgetSessionForTests,
  __resetLocalMediaForTests,
  __setOpfsDirectoryForTests,
  clearAllLocalMedia,
  ensureLocalMediaReady,
  getLocalMediaBackend,
  getLocalMediaBlob,
  getLocalMediaObjectUrl,
  getLocalMediaRecord,
  localMediaExists,
  listLocalMediaRecords,
  removeLocalMedia,
  saveLocalMedia,
} from "../src/lib/media/local-media-storage";
import { pickRecorderMimeType, AUDIO_RECORDER_TYPES } from "../src/lib/media/capture-utils";
import {
  addDemoPostComment,
  listDemoPostComments,
  resetDemoPostComments,
} from "../src/lib/demo/demo-post-comments";
import {
  canInviteToConversation,
  listAlreadyInvitedIds,
  listConversationInviteCandidates,
  listConversationParticipantIds,
} from "../src/lib/chat/conversation-invite-candidates";
import {
  acceptRequest,
  createDemoGroup,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { setDemoIdentity } from "../src/lib/demo/demo-identity";

const projectRoot = join(import.meta.dir, "..");
const A = "lucas";
const B = "beatriz";
const C = "rafael";
const D = "juliana";

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

function createMemoryOpfs() {
  const files = new Map<string, Blob>();
  function directory(prefix: string) {
    return {
      async getDirectoryHandle(name: string) {
        return directory(`${prefix}${name}/`);
      },
      async getFileHandle(name: string, options?: { create?: boolean }) {
        const path = `${prefix}${name}`;
        if (!files.has(path) && !options?.create) {
          throw new DOMException("missing", "NotFoundError");
        }
        return {
          async createWritable() {
            return {
              async write(data: Blob) {
                files.set(path, data);
              },
              async close() {},
            };
          },
          async getFile() {
            const blob = files.get(path);
            if (!blob) throw new DOMException("missing", "NotFoundError");
            return new File([blob], name, { type: blob.type });
          },
        };
      },
      async removeEntry(name: string) {
        files.delete(`${prefix}${name}`);
      },
    };
  }
  return { root: directory(""), files };
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

describe("Mídia local — OPFS", () => {
  afterEach(() => {
    __resetLocalMediaForTests();
  });

  test("inicializa diretórios e grava/lê/remove no OPFS", async () => {
    const opfs = createMemoryOpfs();
    __setOpfsDirectoryForTests(opfs.root);
    const backend = await ensureLocalMediaReady();
    expect(backend).toBe("opfs");
    expect(getLocalMediaBackend()).toBe("opfs");

    const blob = new Blob(["foto-local"], { type: "image/jpeg" });
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob,
      mimeType: "image/jpeg",
      fileName: "chat.jpg",
    });

    expect(record.backend).toBe("opfs");
    expect(record.path).toContain("connexy-media/photos/conversations/");
    expect(await localMediaExists(record.id)).toBe(true);
    expect((await getLocalMediaRecord(record.id))?.mimeType).toBe("image/jpeg");
    expect(await (await getLocalMediaBlob(record.id)).text()).toBe("foto-local");

    const url = await getLocalMediaObjectUrl(record.id);
    expect(url.startsWith("blob:")).toBe(true);

    await removeLocalMedia(record.id);
    expect(await localMediaExists(record.id)).toBe(false);
  });

  test("reconstrói Object URL após reload simulado", async () => {
    const opfs = createMemoryOpfs();
    __setOpfsDirectoryForTests(opfs.root);
    const record = await saveLocalMedia({
      kind: "audio",
      scope: "conversation",
      blob: new Blob(["audio-bytes"], { type: "audio/webm" }),
      mimeType: "audio/webm",
    });
    const first = await getLocalMediaObjectUrl(record.id);
    __forgetSessionForTests();
    __setOpfsDirectoryForTests(opfs.root);
    const second = await getLocalMediaObjectUrl(record.id);
    expect(second).not.toBe(first);
    expect(await (await getLocalMediaBlob(record.id)).text()).toBe("audio-bytes");
  });

  test("arquivo inexistente não quebra a leitura", async () => {
    const opfs = createMemoryOpfs();
    __setOpfsDirectoryForTests(opfs.root);
    const record = await saveLocalMedia({
      kind: "reel",
      scope: "reel",
      blob: new Blob(["reel"], { type: "video/webm" }),
      mimeType: "video/webm",
    });
    const fileName = record.path.split("/").pop()!;
    await opfs.root.getDirectoryHandle("connexy-media").then((root) =>
      root.getDirectoryHandle("reels").then((dir) => dir.removeEntry?.(fileName)),
    );
    await expect(getLocalMediaBlob(record.id)).rejects.toMatchObject({ code: "missing" });
  });

  test("clearAllLocalMedia só apaga quando chamado explicitamente", async () => {
    const opfs = createMemoryOpfs();
    __setOpfsDirectoryForTests(opfs.root);
    await saveLocalMedia({
      kind: "photo",
      scope: "post",
      blob: new Blob(["post"], { type: "image/png" }),
      mimeType: "image/png",
    });
    expect((await listLocalMediaRecords()).length).toBe(1);
    await clearAllLocalMedia();
    expect(await listLocalMediaRecords()).toEqual([]);
  });
});

describe("Mídia local — fallback sem OPFS", () => {
  afterEach(() => {
    __resetLocalMediaForTests();
  });

  test("grava Blob nos metadados quando OPFS não existe", async () => {
    __setOpfsDirectoryForTests(null);
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["fallback"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
    });
    expect(record.backend).toBe("fallback");
    expect(await (await getLocalMediaBlob(record.id)).text()).toBe("fallback");
  });
});

describe("Comentários de publicação", () => {
  beforeEach(() => {
    installBrowser();
    setDemoIdentity("lucas");
    resetDemoPostComments();
  });

  test("cria, persiste e recupera comentários", () => {
    const created = addDemoPostComment("post-1", "  Primeiro  ");
    expect(created?.text).toBe("Primeiro");
    expect(listDemoPostComments("post-1")).toHaveLength(1);
    addDemoPostComment("post-1", "Segundo");
    addDemoPostComment("post-2", "Outro post");
    expect(listDemoPostComments("post-1").map((item) => item.text)).toEqual(["Primeiro", "Segundo"]);

    const snapshot = window.localStorage.getItem("connexy:demo:post-comments");
    expect(snapshot).toContain("Primeiro");
    resetDemoPostComments();
    expect(listDemoPostComments("post-1")).toEqual([]);
  });
});

describe("Convites da conversa", () => {
  beforeEach(() => {
    installBrowser();
    setDemoIdentity(A);
  });

  test("lista conexões dos participantes, remove atuais e duplicados", async () => {
    sendRequest(A, B, "oi");
    const ab = await acceptRequest(A, B);
    sendRequest(A, C, "oi");
    await acceptRequest(A, C);
    sendRequest(B, D, "oi");
    await acceptRequest(B, D);

    const participants = listConversationParticipantIds(ab.conversationId, A);
    expect(participants.sort()).toEqual([A, B].sort());

    const candidates = listConversationInviteCandidates(ab.conversationId, A);
    expect(candidates.map((item) => item.id).sort()).toEqual([C, D].sort());
    expect(candidates.map((item) => item.id)).not.toContain(A);
    expect(candidates.map((item) => item.id)).not.toContain(B);

    createDemoGroup(ab.conversationId, A, [C], "Grupo");
    expect(listAlreadyInvitedIds(ab.conversationId, A)).toContain(C);
    expect(canInviteToConversation(ab.conversationId, A, C)).toBe(false);
    expect(listConversationInviteCandidates(ab.conversationId, A).map((item) => item.id)).toEqual([
      D,
    ]);

    const again = createDemoGroup(ab.conversationId, A, [C], "Grupo duplicado");
    expect(again.participants.filter((item) => item.userId === C)).toHaveLength(1);
  });
});

describe("MediaRecorder", () => {
  test("escolhe o primeiro MIME suportado sem câmera física", () => {
    const original = globalThis.MediaRecorder;
    class FakeRecorder {
      static isTypeSupported(type: string) {
        return type === "audio/webm";
      }
    }
    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      value: FakeRecorder,
    });
    expect(pickRecorderMimeType(AUDIO_RECORDER_TYPES)).toBe("audio/webm");
    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      value: original,
    });
  });
});

describe("Arquitetura local de mídia", () => {
  test("UI não chama OPFS direto e reutiliza o serviço único", async () => {
    const storage = await source("src/lib/media/local-media-storage.ts");
    expect(storage).toContain("navigator.storage.getDirectory");
    expect(storage).toContain("connexy-media");
    expect(storage).toContain("connexy-media-local-db");

    const chat = await source("src/components/chat/ConnexyChatScreen.tsx");
    expect(chat).toContain("CameraCapture");
    expect(chat).toContain("CHAT_VIDEO_MAX_DURATION_SECONDS");
    expect(chat).toContain("ReelRecorder");
    expect(chat).not.toContain("navigator.storage.getDirectory");
    expect(chat).not.toContain("Gravação de áudio ainda não está disponível");

    const recorder = await source("src/components/chat/voice-recorder.tsx");
    expect(recorder).toContain("MediaRecorder");
    expect(recorder).toContain("getUserMedia");

    const post = await source("src/routes/_app/create-post.tsx");
    expect(post).toContain("saveLocalMedia");
    expect(post).not.toContain("readFileAsDataURL");

    const reelPage = await source("src/routes/_app.gerenciar.novo-reel.tsx");
    expect(reelPage).toContain("ReelRecorder");
    expect(reelPage).toContain("Criar Reel");
    expect(reelPage).toContain("Adicionar vídeo");
    expect(reelPage).not.toContain("Escolher vídeo");
    expect(reelPage).not.toContain("Gravar Reel");
  });
});
