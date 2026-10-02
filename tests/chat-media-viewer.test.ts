import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MessageKind, MessageStatus, type ChatMessage } from "../src/lib/chat/chat-types";
import {
  chatMediaDownloadFileName,
  executeOwnMessageDeletion,
  isOpenableChatMedia,
  resolveChatMediaDownload,
} from "../src/lib/chat/chat-message-actions";
import {
  resolveMessageGesture,
  shouldOpenMediaOnPointerEnd,
} from "../src/lib/chat/message-long-press";
import {
  __resetLocalMediaForTests,
  __setOpfsDirectoryForTests,
  LocalMediaError,
  saveLocalMedia,
} from "../src/lib/media/local-media-storage";
import type { StoredMessage } from "../src/lib/persistence/domain/chat-entities";

const projectRoot = join(import.meta.dir, "..");

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

function imageMessage(overrides: Partial<Extract<ChatMessage, { kind: typeof MessageKind.IMAGE }>> = {}) {
  return {
    id: "img-1",
    conversationId: "rafael",
    from: "me" as const,
    at: new Date("2026-09-30T12:00:00.000Z"),
    status: MessageStatus.SENT,
    kind: MessageKind.IMAGE,
    url: "",
    ...overrides,
  } satisfies ChatMessage;
}

function videoMessage(overrides: Partial<Extract<ChatMessage, { kind: typeof MessageKind.VIDEO }>> = {}) {
  return {
    id: "vid-1",
    conversationId: "rafael",
    from: "me" as const,
    at: new Date("2026-09-30T12:00:00.000Z"),
    status: MessageStatus.SENT,
    kind: MessageKind.VIDEO,
    url: "",
    ...overrides,
  } satisfies ChatMessage;
}

describe("Chat — abertura unificada de mídia", () => {
  test("imagem e vídeo próprios abrem o mesmo MediaViewer via onOpenMedia(message)", async () => {
    const image = await readFile(join(projectRoot, "src/components/chat/image-message.tsx"), "utf8");
    const video = await readFile(join(projectRoot, "src/components/chat/video-message.tsx"), "utf8");
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    const list = await readFile(join(projectRoot, "src/components/chat/message-list.tsx"), "utf8");
    const screen = await readFile(join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"), "utf8");
    const viewer = await readFile(join(projectRoot, "src/components/system/media-viewer.tsx"), "utf8");

    expect(image).toContain("onOpenMedia");
    expect(image).toContain('aria-label={selecting ? "Selecionar foto" : "Abrir foto"}');
    expect(image).not.toContain("PhotoViewer");
    expect(image).not.toContain("MediaViewer");
    expect(video).toContain("onOpenMedia");
    expect(video).toContain('aria-label={selecting ? "Selecionar vídeo" : "Abrir vídeo"}');
    expect(video).not.toContain("MediaViewer");
    expect(video).toContain("pointer-events-none");
    expect(video).not.toContain("controls");
    expect(bubble).toContain("onOpenMedia={() => options.onOpenMedia?.(message)}");
    expect(bubble).toContain("shouldOpenMediaOnPointerEnd");
    expect(bubble).toContain("isOpenableChatMedia");
    expect(list).toContain("onOpenMedia={onOpenMedia}");
    expect(screen).toContain("handleOpenMedia");
    expect(screen).toContain("ChatThreadMediaViewer");
    expect(screen).toContain("MediaViewer");
    expect(screen).toContain("variant=\"chat\"");
    expect(screen).toContain("message.mediaId");
    expect(viewer).toContain('label="Baixar"');
    expect(viewer).toContain('label="Excluir"');
    expect(viewer).toContain('aria-label="Fechar"');
    expect(viewer).toContain("controls");
    expect(viewer).toContain("autoPlay");
  });

  test("toque curto abre mídia e o modo seleção não abre o viewer", () => {
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 80,
        movedPx: 0,
        isMedia: true,
      }),
    ).toBe("open-media");
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: true,
        heldMs: 80,
        movedPx: 0,
        isMedia: true,
      }),
    ).toBe("toggle-selection");
    expect(
      shouldOpenMediaOnPointerEnd({ selecting: false, longPressRecognized: false }),
    ).toBe(true);
    expect(
      shouldOpenMediaOnPointerEnd({ selecting: true, longPressRecognized: false }),
    ).toBe(false);
    expect(
      shouldOpenMediaOnPointerEnd({ selecting: false, longPressRecognized: true }),
    ).toBe(false);
    expect(isOpenableChatMedia(imageMessage())).toBe(true);
    expect(isOpenableChatMedia(videoMessage())).toBe(true);
    expect(
      isOpenableChatMedia({
        id: "t1",
        conversationId: "rafael",
        from: "me",
        at: new Date(),
        status: MessageStatus.SENT,
        kind: MessageKind.TEXT,
        text: "oi",
      }),
    ).toBe(false);
  });
});

describe("Chat — download pelo mediaId", () => {
  afterEach(() => {
    __resetLocalMediaForTests();
  });

  test("nomes visíveis são foto.jpg e video.mp4, sem IDs internos", () => {
    expect(chatMediaDownloadFileName({ kind: MessageKind.IMAGE, mimeType: "image/jpeg" })).toBe(
      "foto.jpg",
    );
    expect(chatMediaDownloadFileName({ kind: MessageKind.VIDEO, mimeType: "video/mp4" })).toBe(
      "video.mp4",
    );
    expect(
      chatMediaDownloadFileName({
        kind: MessageKind.IMAGE,
        mimeType: "image/jpeg",
        storedFileName: "media-123-abc.jpg",
      }),
    ).toBe("foto.jpg");
    expect(
      chatMediaDownloadFileName({
        kind: MessageKind.IMAGE,
        mimeType: "image/jpeg",
        storedFileName: "foto-1790787630452.jpg",
      }),
    ).toBe("foto.jpg");
    expect(
      chatMediaDownloadFileName({
        kind: MessageKind.VIDEO,
        storedFileName: "undefined",
        mimeType: "video/mp4",
      }),
    ).toBe("video.mp4");
    expect(
      chatMediaDownloadFileName({
        kind: MessageKind.VIDEO,
        mimeType: "video/webm",
        storedFileName: "reel-1790787836815.webm",
      }),
    ).toBe("video.webm");
    expect(
      chatMediaDownloadFileName({
        kind: MessageKind.IMAGE,
        storedFileName: "praia.jpg",
        mimeType: "image/jpeg",
      }),
    ).toBe("praia.jpg");
  });

  test("recupera o blob da imagem pelo mediaId da mensagem", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["pixels-foto"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
    });
    const resolved = await resolveChatMediaDownload(
      imageMessage({ mediaId: record.id, caption: "não usar este texto" }),
    );
    expect(await resolved.blob.text()).toBe("pixels-foto");
    expect(resolved.blob.type).toBe("image/jpeg");
    expect(resolved.fileName).toBe("foto.jpg");
    expect(resolved.fileName).not.toContain(record.id);
    expect(resolved.fileName).not.toContain("não usar");
  });

  test("recupera o blob do vídeo pelo mediaId da mensagem", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["frames-video"], { type: "video/mp4" }),
      mimeType: "video/mp4",
    });
    const resolved = await resolveChatMediaDownload(videoMessage({ mediaId: record.id }));
    expect(await resolved.blob.text()).toBe("frames-video");
    expect(resolved.blob.type).toBe("video/mp4");
    expect(resolved.fileName).toBe("video.mp4");
  });

  test("mediaId inexistente não baixa outro arquivo e blob vazio gera erro", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    const other = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["outro-arquivo"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
    });
    await expect(
      resolveChatMediaDownload(imageMessage({ mediaId: "media-ausente" })),
    ).rejects.toBeInstanceOf(LocalMediaError);
    await expect(resolveChatMediaDownload(imageMessage({ mediaId: "media-ausente" }))).rejects.toMatchObject({
      code: "missing",
    });
    expect(other.id).not.toBe("media-ausente");

    const empty = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob([], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      id: "media-empty",
    });
    await expect(resolveChatMediaDownload(imageMessage({ mediaId: empty.id }))).rejects.toThrow(
      "empty-media",
    );
  });

  test("exclusão da mensagem própria continua removendo a mídia pelo mediaId", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["apagar"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
    });
    const stored: StoredMessage = {
      id: "img-1",
      conversationId: "rafael",
      from: "me",
      senderId: "u1",
      text: "Foto",
      at: Date.now(),
      kind: MessageKind.IMAGE,
      payload: { mediaId: record.id },
    };
    const rows = new Map([[stored.id, stored]]);
    const removed: string[] = [];
    const result = await executeOwnMessageDeletion(
      { conversationId: "rafael", currentUserId: "u1", messageIds: ["img-1"] },
      {
        getMessage: (_conversationId, id) => rows.get(id) ?? null,
        persistDelete: async (_conversationId, id) => {
          rows.delete(id);
        },
        refreshSummary: async () => undefined,
        listMessages: () => [...rows.values()],
        removeMediaFile: async (mediaId) => {
          removed.push(mediaId);
        },
      },
    );
    expect(result.deletedIds).toEqual(["img-1"]);
    expect(removed).toEqual([record.id]);
  });
});
