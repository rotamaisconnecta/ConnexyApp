import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MessageKind, MessageStatus, type ChatMessage } from "../src/lib/chat/chat-types";
import {
  isChatMediaActionTarget,
  isOpenableChatDocument,
  isOpenableChatMedia,
  openChatDocument,
  resolveChatMediaDownload,
} from "../src/lib/chat/chat-message-actions";
import { shouldOpenMediaOnPointerEnd } from "../src/lib/chat/message-long-press";
import {
  __resetLocalMediaForTests,
  __setOpfsDirectoryForTests,
  saveLocalMedia,
} from "../src/lib/media/local-media-storage";

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

function fileMessage(
  overrides: Partial<Extract<ChatMessage, { kind: typeof MessageKind.FILE }>> = {},
): ChatMessage {
  return {
    id: "doc-1",
    conversationId: "rafael",
    from: "me",
    at: new Date("2026-09-30T12:00:00.000Z"),
    status: MessageStatus.SENT,
    kind: MessageKind.FILE,
    fileName: "contrato.pdf",
    fileSize: 12,
    mimeType: "application/pdf",
    ...overrides,
  };
}

describe("Ações discretas em mídia e documentos", () => {
  test("hover próprio mostra Baixar e Excluir sem ocupar a bolha o tempo todo", async () => {
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    const actions = await readFile(join(projectRoot, "src/components/chat/own-media-actions.tsx"), "utf8");
    const image = await readFile(join(projectRoot, "src/components/chat/image-message.tsx"), "utf8");
    const video = await readFile(join(projectRoot, "src/components/chat/video-message.tsx"), "utf8");
    expect(bubble).toContain("OwnMediaHoverActions");
    expect(bubble).toContain("group/media");
    expect(bubble).toContain("message.from !== \"me\"");
    expect(bubble).toContain("options.selecting");
    expect(actions).toContain('aria-label="Baixar"');
    expect(actions).toContain('aria-label="Excluir"');
    expect(actions).toContain("data-chat-media-action");
    expect(actions).toContain("group-hover/media:!opacity-100");
    expect(actions).toContain("[@media(hover:none)]:hidden");
    expect(image).toContain("onOpenMedia");
    expect(video).toContain("onOpenMedia");
    expect(image).not.toContain("OwnMediaHoverActions");
    expect(video).not.toContain("OwnMediaHoverActions");
  });

  test("toque em foto e vídeo continua abrindo o MediaViewer; documento não usa o viewer", async () => {
    const file = await readFile(join(projectRoot, "src/components/chat/file-message.tsx"), "utf8");
    const screen = await readFile(join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"), "utf8");
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    expect(file).toContain("onOpen");
    expect(file).toContain('aria-label={selecting ? "Selecionar documento"');
    expect(file).not.toContain("MediaViewer");
    expect(file).not.toContain("Download");
    expect(screen).toContain("openChatDocument");
    expect(screen).toContain("handleOpenDocument");
    expect(screen).not.toMatch(/isOpenableChatDocument[\s\S]{0,80}setViewingMessage/);
    expect(bubble).toContain("isOpenableChatDocument");
    expect(bubble).toContain("isChatMediaActionTarget");
    expect(isOpenableChatMedia(fileMessage())).toBe(false);
    expect(isOpenableChatDocument(fileMessage())).toBe(true);
  });

  test("modo seleção não abre viewer nem documento", () => {
    expect(shouldOpenMediaOnPointerEnd({ selecting: true, longPressRecognized: false })).toBe(false);
    expect(shouldOpenMediaOnPointerEnd({ selecting: false, longPressRecognized: true })).toBe(false);
    expect(shouldOpenMediaOnPointerEnd({ selecting: false, longPressRecognized: false })).toBe(true);
    expect(isChatMediaActionTarget(null)).toBe(false);
  });
});

describe("Documento — abertura externa e download pelo mediaId", () => {
  afterEach(() => {
    __resetLocalMediaForTests();
  });

  test("abre pelo MIME real sem download forçado e sem MediaViewer", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["%PDF-1.4 contrato"], { type: "application/pdf" }),
      mimeType: "application/pdf",
      fileName: "contrato.pdf",
    });
    const opened: { url: string; target?: string }[] = [];
    const previousOpen = globalThis.window?.open;
    Object.assign(globalThis, {
      window: {
        ...(globalThis.window ?? {}),
        open: (url: string, target?: string) => {
          opened.push({ url, target });
          return { closed: false };
        },
        setTimeout: globalThis.setTimeout.bind(globalThis),
      },
    });
    await openChatDocument(fileMessage({ mediaId: record.id, mimeType: "application/pdf" }));
    expect(opened).toHaveLength(1);
    expect(opened[0]?.target).toBe("_blank");
    expect(opened[0]?.url.startsWith("blob:")).toBe(true);
    const actions = await readFile(join(projectRoot, "src/lib/chat/chat-message-actions.ts"), "utf8");
    const openFn = actions.slice(actions.indexOf("export async function openChatDocument"));
    expect(openFn).not.toContain("link.download");
    expect(openFn).not.toContain("MediaViewer");
    expect(openFn).toContain("message.mimeType");
    expect(openFn).toContain("resolveChatMediaDownload");
    if (previousOpen) {
      (globalThis.window as Window & { open: typeof previousOpen }).open = previousOpen;
    }
  });

  test("download do documento preserva nome, MIME e conteúdo", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    const record = await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["planilha-xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "orcamento.xlsx",
    });
    const resolved = await resolveChatMediaDownload(
      fileMessage({
        mediaId: record.id,
        fileName: "orcamento.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    expect(await resolved.blob.text()).toBe("planilha-xlsx");
    expect(resolved.fileName).toBe("orcamento.xlsx");
    expect(resolved.blob.type).toContain("spreadsheetml");
  });

  test("mediaId inexistente não abre nem baixa outro arquivo", async () => {
    __setOpfsDirectoryForTests(createMemoryOpfs().root);
    await saveLocalMedia({
      kind: "photo",
      scope: "conversation",
      blob: new Blob(["outro"], { type: "application/pdf" }),
      mimeType: "application/pdf",
      fileName: "outro.pdf",
    });
    await expect(openChatDocument(fileMessage({ mediaId: "media-ausente" }))).rejects.toThrow();
    await expect(resolveChatMediaDownload(fileMessage({ mediaId: "media-ausente" }))).rejects.toThrow();
  });
});
