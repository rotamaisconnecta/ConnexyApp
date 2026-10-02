import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MessageKind, MessageStatus, type ChatMessage } from "../src/lib/chat/chat-types";
import { copyableTextForMessage, copyableTextForMessages } from "../src/lib/chat/chat-message-actions";
import { resolveChatPhotoFile } from "../src/lib/media/share-local-photo";
import {
  clampPan,
  clampScale,
  containedImageSize,
  nextDoubleTapScale,
  PHOTO_VIEWER_DOUBLE_TAP_SCALE,
  PHOTO_VIEWER_HIDE_CONTROLS_MS,
  PHOTO_VIEWER_MAX_SCALE,
  shouldCloseOnSwipe,
} from "../src/lib/media/photo-viewer-transform";

const projectRoot = join(import.meta.dir, "..");

function textMessage(text: string): ChatMessage {
  return {
    id: "t1",
    conversationId: "c1",
    from: "me",
    at: new Date("2026-09-30T00:00:00.000Z"),
    status: MessageStatus.SENT,
    kind: MessageKind.TEXT,
    text,
  };
}

describe("Photo Viewer — gestos", () => {
  test("contain preserva a proporção de fotos verticais, horizontais e quadradas", () => {
    expect(containedImageSize(1000, 2000, 390, 700)).toEqual({ width: 350, height: 700 });
    expect(containedImageSize(2000, 1000, 390, 700)).toEqual({ width: 390, height: 195 });
    expect(containedImageSize(800, 800, 390, 700)).toEqual({ width: 390, height: 390 });
  });

  test("zoom fica entre 1x e o máximo e o duplo toque alterna", () => {
    expect(clampScale(0.2)).toBe(1);
    expect(clampScale(9)).toBe(PHOTO_VIEWER_MAX_SCALE);
    expect(nextDoubleTapScale(1)).toBe(PHOTO_VIEWER_DOUBLE_TAP_SCALE);
    expect(nextDoubleTapScale(2.4)).toBe(1);
  });

  test("pan só existe com zoom e swipe fecha só em 1x", () => {
    expect(clampPan(80, 40, 1, { width: 200, height: 200 }, { width: 390, height: 700 })).toEqual({
      x: 0,
      y: 0,
    });
    expect(shouldCloseOnSwipe(140, 0, 1)).toBe(true);
    expect(shouldCloseOnSwipe(140, 0, 2)).toBe(false);
    expect(PHOTO_VIEWER_HIDE_CONTROLS_MS).toBe(3000);
  });
});

describe("Photo Viewer — arquivo real", () => {
  test("resolve um Blob/File a partir da URL temporária, sem ID interno no nome", async () => {
    const blob = new Blob(["foto"], { type: "image/jpeg" });
    const src = URL.createObjectURL(blob);
    const photo = await resolveChatPhotoFile({ src });
    expect(photo.blob.type).toBe("image/jpeg");
    expect(photo.file.name).toBe("foto-connexy.jpg");
    expect(photo.file.name).not.toContain("blob:");
    expect(photo.file.name).not.toContain("opfs");
    URL.revokeObjectURL(src);
  });
});

describe("Photo Viewer — UI", () => {
  test("PhotoViewer mantém Salvar e Compartilhar no componente isolado", async () => {
    const viewer = await readFile(join(projectRoot, "src/components/chat/photo-viewer.tsx"), "utf8");
    expect(viewer).toContain('aria-label="Salvar"');
    expect(viewer).toContain('aria-label="Compartilhar"');
    expect(viewer).toContain('aria-label="Fechar"');
    expect(viewer).toContain("object-contain");
    expect(viewer).not.toContain("Copiar");
    expect(viewer).not.toContain("Excluir");
    expect(viewer).not.toContain("emoji");
  });
});

describe("Copiar — conteúdo selecionado", () => {
  test("copia o texto das mensagens selecionadas e ignora foto sem legenda", () => {
    expect(copyableTextForMessage(textMessage("  olá  "))).toBe("olá");
    expect(
      copyableTextForMessages([
        textMessage("primeira"),
        {
          id: "img",
          conversationId: "c1",
          from: "me",
          at: new Date(),
          status: MessageStatus.SENT,
          kind: MessageKind.IMAGE,
          url: "blob:internal",
        },
        textMessage("segunda"),
      ]),
    ).toBe("primeira\n\nsegunda");
  });
});
