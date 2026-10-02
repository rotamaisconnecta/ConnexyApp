import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ATTACHMENT_OPTIONS, MessageKind } from "../src/lib/chat/chat-types";
import {
  COMPOSER_MAX_VISIBLE_LINES,
  composerMaxHeightPx,
  mergeComposerSuggestion,
} from "../src/lib/chat/composer-suggestion";
import {
  batchDeleteTitle,
  isChatMessageSelectable,
  longPressActionForMessage,
  SELECTION_LONG_PRESS_MS,
  selectedCountLabel,
} from "../src/lib/chat/chat-selection";
import { visibleMediaCaption } from "../src/lib/chat/visible-media-caption";
import { demoMessageToChatMessage } from "../src/lib/chat/demo-chat-adapter";
import {
  DeleteFailureReason,
  evaluateMessageDeletion,
  executeOwnMessageDeletion,
  isDownloadableChatMedia,
  isOwnStoredMessage,
} from "../src/lib/chat/chat-message-actions";
import type { StoredMessage } from "../src/lib/persistence/domain/chat-entities";
import type { ChatMessage } from "../src/lib/chat/chat-types";

const projectRoot = join(import.meta.dir, "..");

function stored(partial: Partial<StoredMessage> & Pick<StoredMessage, "id" | "conversationId" | "from" | "text">): StoredMessage {
  return { at: 1, ...partial };
}

describe("Perfil sem Momentos", () => {
  test("abas de publicações não incluem Momentos", async () => {
    const own = await readFile(join(projectRoot, "src/routes/_app.perfil.index.tsx"), "utf8");
    const other = await readFile(join(projectRoot, "src/routes/_app.perfil.$id.tsx"), "utf8");
    expect(own).not.toContain('"Momentos"');
    expect(other).not.toContain('"Momentos"');
    expect(own).toContain('["Tudo", "Fotos"]');
    expect(other).toContain('["Tudo", "Fotos"]');
  });
});

describe("Menu + Carona ao lado de Negócio", () => {
  test("Carona Amiga vem imediatamente após Negócio e usa /carona/nova", async () => {
    const hub = await readFile(join(projectRoot, "src/routes/_app/create.tsx"), "utf8");
    const ids = [...hub.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
    expect(ids.indexOf("carona")).toBe(ids.indexOf("business") + 1);
    expect(hub).toContain('route: "/carona/nova"');
  });
});

describe("Legenda visível da foto", () => {
  test("não exibe nome de arquivo, mediaId ou blob", () => {
    expect(visibleMediaCaption("IMG_1234.jpg")).toBeUndefined();
    expect(visibleMediaCaption("foto.webp")).toBeUndefined();
    expect(visibleMediaCaption("abc", { fileName: "abc" })).toBeUndefined();
    expect(visibleMediaCaption("media-1", { mediaId: "media-1" })).toBeUndefined();
    expect(visibleMediaCaption("blob:http://localhost/1")).toBeUndefined();
    expect(visibleMediaCaption("Pôr do sol na orla")).toBe("Pôr do sol na orla");
  });

  test("adapter de imagem não usa fileName como caption", () => {
    const message = demoMessageToChatMessage(
      "c1",
      stored({
        id: "m1",
        conversationId: "c1",
        from: "me",
        text: "captura.jpg",
        kind: "image",
        payload: { mediaId: "media-1", fileName: "captura.jpg", dataUrl: "" },
      }),
      "user-1",
    );
    expect(message.kind).toBe(MessageKind.IMAGE);
    if (message.kind === MessageKind.IMAGE) {
      expect(message.caption).toBeUndefined();
    }
  });
});

describe("Foto estável", () => {
  test("bolha de imagem não usa pulse nem some ao carregar", async () => {
    const source = await readFile(join(projectRoot, "src/components/chat/image-message.tsx"), "utf8");
    expect(source).not.toContain("animate-pulse");
    expect(source).not.toContain("opacity-0");
    expect(source).toContain("onOpenMedia");
    expect(source).not.toContain("PhotoViewer");
  });
});

describe("Composer de 5 linhas", () => {
  test("cresce até 5 linhas e depois usa altura máxima", () => {
    expect(COMPOSER_MAX_VISIBLE_LINES).toBe(5);
    expect(composerMaxHeightPx(5)).toBeGreaterThan(composerMaxHeightPx(2));
    expect(composerMaxHeightPx(6)).toBeGreaterThan(composerMaxHeightPx(5));
  });

  test("campo usa a altura máxima de 5 linhas", async () => {
    const source = await readFile(join(projectRoot, "src/components/chat/message-input.tsx"), "utf8");
    expect(source).toContain("composerMaxHeightPx");
    expect(source).toContain("overflowY");
  });
});

describe("Câmera × Anexar", () => {
  test("anexar não oferece Câmera nem Vídeo", () => {
    expect(ATTACHMENT_OPTIONS.some((item) => item.label === "Câmera")).toBe(false);
    expect(ATTACHMENT_OPTIONS.some((item) => item.kind === "camera")).toBe(false);
    expect(ATTACHMENT_OPTIONS.some((item) => item.kind === MessageKind.VIDEO)).toBe(false);
    expect(ATTACHMENT_OPTIONS.some((item) => item.label === "Vídeo")).toBe(false);
    expect(ATTACHMENT_OPTIONS.some((item) => item.label === "Áudio")).toBe(false);
    expect(ATTACHMENT_OPTIONS.some((item) => item.kind === MessageKind.AUDIO)).toBe(false);
  });

  test("botão da câmera oferece foto e vídeo", async () => {
    const sheet = await readFile(join(projectRoot, "src/components/chat/camera-choice-sheet.tsx"), "utf8");
    const input = await readFile(join(projectRoot, "src/components/chat/message-input.tsx"), "utf8");
    expect(sheet).toContain("Capturar foto");
    expect(sheet).toContain("Gravar vídeo");
    expect(input).toContain("CameraChoiceSheet");
    expect(input).toContain("onCapturePhoto");
    expect(input).toContain("onRecordVideo");
  });
});

describe("Assistente Copiar e editar", () => {
  test("insere no composer sem enviar", async () => {
    const assistant = await readFile(
      join(projectRoot, "src/components/ai/connexy-ai-assistant.tsx"),
      "utf8",
    );
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    const input = await readFile(join(projectRoot, "src/components/chat/message-input.tsx"), "utf8");
    expect(assistant).toContain("Copiar e editar");
    expect(assistant).toContain("onInsertSuggestion");
    expect(screen).toContain("onInsertSuggestion");
    expect(screen).toContain("setComposerInsert");
    expect(input).toContain("mergeComposerSuggestion");
    const insertEffect = input.slice(
      input.indexOf("if (!insertRequest"),
      input.indexOf("const handleSend"),
    );
    expect(insertEffect).toContain("onInsertRequestHandled");
    expect(insertEffect).not.toContain("onSendText");
    expect(insertEffect).not.toContain("handleSend");
  });

  test("não apaga texto já digitado", () => {
    expect(mergeComposerSuggestion("Oi", "Tudo bem?")).toBe("Oi\nTudo bem?");
    expect(mergeComposerSuggestion("", "Oi")).toBe("Oi");
    expect(mergeComposerSuggestion("Oi\nTudo bem?", "Tudo bem?")).toBe("Oi\nTudo bem?");
  });
});

describe("Seleção de mensagens", () => {
  test("pressionar e segurar próprio entra em seleção", async () => {
    expect(SELECTION_LONG_PRESS_MS).toBe(500);
    expect(longPressActionForMessage(true)).toBe("select");
    expect(longPressActionForMessage(false)).toBe("peer-actions");
    expect(isChatMessageSelectable("me")).toBe(true);
    expect(isChatMessageSelectable("them")).toBe(false);
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    expect(screen).toContain("Selecionar mensagens");
    expect(screen).toContain("enterSelection()");
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    expect(bubble).toContain("SELECTION_LONG_PRESS_MS");
    expect(bubble).toContain("onEnterSelection");
    expect(selectedCountLabel(0)).toBe("0 selecionadas");
    expect(selectedCountLabel(1)).toBe("1 selecionada");
    expect(selectedCountLabel(3)).toBe("3 selecionadas");
    expect(batchDeleteTitle(4)).toBe("Excluir 4 itens?");
  });

  test("toque em foto no modo seleção não abre o visualizador", async () => {
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    const image = await readFile(join(projectRoot, "src/components/chat/image-message.tsx"), "utf8");
    const video = await readFile(join(projectRoot, "src/components/chat/video-message.tsx"), "utf8");
    expect(bubble).toContain("selecting={options.selecting}");
    expect(image).toContain("selecting");
    expect(image).toContain("onOpenMedia");
    expect(video).toContain("onOpenMedia");
    expect(image).not.toContain("isOpen={open && !selecting}");
    expect(video).not.toContain("isOpen={open && !selecting}");
  });
});

describe("Exclusão segura de mensagens próprias", () => {
  const me = stored({
    id: "mine",
    conversationId: "c1",
    from: "me",
    senderId: "u1",
    text: "oi",
    kind: "text",
  });
  const photo = stored({
    id: "photo",
    conversationId: "c1",
    from: "me",
    senderId: "u1",
    text: "Foto",
    kind: "image",
    payload: { mediaId: "media-photo" },
  });
  const video = stored({
    id: "video",
    conversationId: "c1",
    from: "me",
    senderId: "u1",
    text: "Vídeo",
    kind: "video",
    payload: { mediaId: "media-video" },
  });
  const peer = stored({
    id: "peer",
    conversationId: "c1",
    from: "them",
    senderId: "u2",
    text: "olá",
  });
  const otherThread = stored({
    id: "other",
    conversationId: "c2",
    from: "me",
    senderId: "u1",
    text: "outra conversa",
  });

  test("usuário exclui a própria foto, vídeo e texto", async () => {
    const rows = new Map([
      [me.id, me],
      [photo.id, photo],
      [video.id, video],
    ]);
    const result = await executeOwnMessageDeletion(
      { conversationId: "c1", currentUserId: "u1", messageIds: [me.id, photo.id, video.id] },
      {
        getMessage: (_conversationId, id) => rows.get(id) ?? null,
        persistDelete: async (_conversationId, id) => {
          rows.delete(id);
        },
        refreshSummary: async () => undefined,
        listMessages: () => [...rows.values()],
      },
    );
    expect(result.deletedIds.sort()).toEqual(["mine", "photo", "video"].sort());
    expect(result.failed).toEqual([]);
    expect(rows.size).toBe(0);
  });

  test("não exclui mídia da outra pessoa nem de outra conversa", async () => {
    expect(
      evaluateMessageDeletion({
        message: otherThread,
        conversationId: "c1",
        currentUserId: "u1",
        messageId: otherThread.id,
      }).ok,
    ).toBe(false);
    expect(evaluateMessageDeletion({
      message: peer,
      conversationId: "c1",
      currentUserId: "u1",
      messageId: peer.id,
    }).ok).toBe(false);
    const rows = new Map([[peer.id, peer], [otherThread.id, otherThread], [me.id, me]]);
    const result = await executeOwnMessageDeletion(
      { conversationId: "c1", currentUserId: "u1", messageIds: [peer.id, otherThread.id, "missing", me.id] },
      {
        getMessage: (conversationId, id) => {
          const row = rows.get(id) ?? null;
          return row && row.conversationId === conversationId ? row : null;
        },
        persistDelete: async (_conversationId, id) => {
          rows.delete(id);
        },
        refreshSummary: async () => undefined,
        listMessages: () => [...rows.values()],
      },
    );
    expect(result.deletedIds).toEqual(["mine"]);
    expect(result.failed.map((item) => item.reason)).toEqual([
      DeleteFailureReason.NOT_OWNER,
      DeleteFailureReason.NOT_FOUND,
      DeleteFailureReason.NOT_FOUND,
    ]);
    expect(rows.has("peer")).toBe(true);
    expect(rows.has("other")).toBe(true);
  });

  test("confirmação aparece antes da exclusão e cancelar não altera nada", async () => {
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    expect(screen).toContain("ChatConfirmDialog");
    expect(screen).toContain("pendingDelete");
    expect(screen).toContain("onCancel={() => setPendingDelete(null)}");
    expect(screen).toContain("confirmPendingDelete");
    expect(screen).not.toMatch(/onRequestDelete[\s\S]{0,40}deleteMessages\(/);
  });

  test("falha na persistência não remove o registro", async () => {
    const rows = new Map([[me.id, me], [photo.id, photo]]);
    const result = await executeOwnMessageDeletion(
      { conversationId: "c1", currentUserId: "u1", messageIds: [me.id, photo.id] },
      {
        getMessage: (_conversationId, id) => rows.get(id) ?? null,
        persistDelete: async (_conversationId, id) => {
          if (id === photo.id) throw new Error("persist failed");
          rows.delete(id);
        },
        refreshSummary: async () => undefined,
        listMessages: () => [...rows.values()],
      },
    );
    expect(result.deletedIds).toEqual(["mine"]);
    expect(result.failed).toEqual([{ messageId: "photo", reason: DeleteFailureReason.PERSIST_FAILED }]);
    expect(rows.has("photo")).toBe(true);
    expect(rows.has("mine")).toBe(false);
  });

  test("excluir uma mídia não exclui a conversa nem outras mídias", async () => {
    const keep = stored({
      id: "keep",
      conversationId: "c1",
      from: "me",
      senderId: "u1",
      text: "Foto",
      kind: "image",
      payload: { mediaId: "media-keep" },
    });
    const conversation = { id: "c1" };
    const rows = new Map([[photo.id, photo], [keep.id, keep]]);
    await executeOwnMessageDeletion(
      { conversationId: "c1", currentUserId: "u1", messageIds: [photo.id] },
      {
        getMessage: (_conversationId, id) => rows.get(id) ?? null,
        persistDelete: async (_conversationId, id) => {
          rows.delete(id);
        },
        refreshSummary: async () => {
          conversation.id = "c1";
        },
        listMessages: () => [...rows.values()],
      },
    );
    expect(conversation.id).toBe("c1");
    expect(rows.has("keep")).toBe(true);
    expect(rows.has("photo")).toBe(false);
  });

  test("baixar não exclui e IDs inexistentes não apagam outro registro", async () => {
    const image: ChatMessage = {
      id: "photo",
      conversationId: "c1",
      from: "me",
      kind: MessageKind.IMAGE,
      url: "",
      mediaId: "media-photo",
      at: new Date(),
      status: "read",
    };
    expect(isDownloadableChatMedia(image)).toBe(true);
    const rows = new Map([[me.id, me]]);
    const result = await executeOwnMessageDeletion(
      { conversationId: "c1", currentUserId: "u1", messageIds: ["ghost"] },
      {
        getMessage: (_conversationId, id) => rows.get(id) ?? null,
        persistDelete: async (_conversationId, id) => {
          rows.delete(id);
        },
        refreshSummary: async () => undefined,
        listMessages: () => [...rows.values()],
      },
    );
    expect(result.deletedIds).toEqual([]);
    expect(rows.has("mine")).toBe(true);
    const actions = await readFile(join(projectRoot, "src/lib/chat/chat-message-actions.ts"), "utf8");
    expect(actions).not.toContain("setInterval");
    expect(actions).not.toContain("TTL");
    expect(actions).not.toContain("auto-delete");
  });
});
