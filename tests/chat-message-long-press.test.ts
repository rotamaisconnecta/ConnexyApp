import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SELECTION_LONG_PRESS_MS } from "../src/lib/chat/chat-selection";
import {
  beginOwnMessageSelection,
  LONG_PRESS_MOVE_CANCEL_PX,
  movementCancelsLongPress,
  resolveMessageGesture,
  shouldOpenMediaOnPointerEnd,
  toggleOwnMessageSelection,
} from "../src/lib/chat/message-long-press";

const projectRoot = join(import.meta.dir, "..");

describe("Long press — entrada no modo de seleção", () => {
  test("pressionar e segurar mensagem própria entra no modo seleção e seleciona a mensagem", () => {
    expect(SELECTION_LONG_PRESS_MS).toBe(500);
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 500,
        movedPx: 0,
        isMedia: false,
      }),
    ).toBe("enter-selection");
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 500,
        movedPx: 0,
        isMedia: true,
      }),
    ).toBe("enter-selection");
    expect(beginOwnMessageSelection([], "msg-1")).toEqual(["msg-1"]);
    expect(beginOwnMessageSelection(["msg-1"], "msg-1")).toEqual(["msg-1"]);
  });

  test("long press não exclui e não abre mídia", () => {
    expect(
      shouldOpenMediaOnPointerEnd({ selecting: false, longPressRecognized: true }),
    ).toBe(false);
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 500,
        movedPx: 0,
        isMedia: true,
      }),
    ).not.toBe("open-media");
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 500,
        movedPx: 0,
        isMedia: true,
      }),
    ).not.toBe("toggle-selection");
  });

  test("pressionar e segurar mensagem recebida não permite selecioná-la para exclusão", () => {
    expect(
      resolveMessageGesture({
        from: "them",
        selecting: false,
        heldMs: 500,
        movedPx: 0,
        isMedia: true,
      }),
    ).toBe("peer-ignore-select");
    expect(
      resolveMessageGesture({
        from: "them",
        selecting: true,
        heldMs: 80,
        movedPx: 0,
        isMedia: true,
      }),
    ).toBe("peer-ignore-select");
  });

  test("depois do long press, outras mensagens próprias podem ser selecionadas e o segundo toque remove", () => {
    const afterFirst = beginOwnMessageSelection([], "msg-2");
    const afterThird = beginOwnMessageSelection(
      beginOwnMessageSelection(afterFirst, "msg-5"),
      "msg-9",
    );
    expect(afterThird).toEqual(["msg-2", "msg-5", "msg-9"]);
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: true,
        heldMs: 80,
        movedPx: 0,
        isMedia: false,
      }),
    ).toBe("toggle-selection");
    expect(toggleOwnMessageSelection(afterThird, "msg-5")).toEqual(["msg-2", "msg-9"]);
  });

  test("toque normal fora do modo seleção continua funcionando", () => {
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 80,
        movedPx: 0,
        isMedia: false,
      }),
    ).toBe("normal-tap");
    expect(
      resolveMessageGesture({
        from: "them",
        selecting: false,
        heldMs: 80,
        movedPx: 0,
        isMedia: false,
      }),
    ).toBe("normal-tap");
    expect(
      shouldOpenMediaOnPointerEnd({ selecting: false, longPressRecognized: false }),
    ).toBe(true);
  });

  test("foto e vídeo abrem fora do modo seleção e só selecionam dentro dele", () => {
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
      resolveMessageGesture({
        from: "me",
        selecting: true,
        heldMs: 80,
        movedPx: 0,
        isMedia: true,
      }),
    ).not.toBe("open-media");
  });

  test("arrastar/rolar cancela o long press", () => {
    expect(movementCancelsLongPress(0, LONG_PRESS_MOVE_CANCEL_PX + 1)).toBe(true);
    expect(movementCancelsLongPress(2, 2)).toBe(false);
    expect(
      resolveMessageGesture({
        from: "me",
        selecting: false,
        heldMs: 120,
        movedPx: 20,
        isMedia: true,
      }),
    ).toBe("cancel-scroll");
  });
});

describe("Long press na UI da conversa", () => {
  test("bolha própria usa long press de 500ms sem excluir no gesto", async () => {
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    const hook = await readFile(
      join(projectRoot, "src/components/chat/use-message-long-press.ts"),
      "utf8",
    );
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    const image = await readFile(join(projectRoot, "src/components/chat/image-message.tsx"), "utf8");
    const video = await readFile(join(projectRoot, "src/components/chat/video-message.tsx"), "utf8");

    expect(bubble).toContain("useMessageLongPress");
    expect(bubble).toContain("SELECTION_LONG_PRESS_MS");
    expect(bubble).toContain("onEnterSelection");
    expect(bubble).toContain("enabled: selectable");
    expect(bubble).toContain("consumeClickSuppression");
    expect(hook).toContain("onPointerMove");
    expect(hook).toContain("movementCancelsLongPress");
    expect(hook).not.toContain("delete");
    expect(screen).toContain("exitSelection");
    expect(screen).toContain("beginOwnMessageSelection");
    expect(screen).not.toMatch(/onLongPress[\s\S]{0,80}requestDeleteMessages/);
    expect(image).toContain("onOpenMedia");
    expect(video).toContain("onOpenMedia");
    expect(image).not.toContain("isOpen={open && !selecting}");
    expect(video).not.toContain("isOpen={open && !selecting}");
    expect(image).not.toContain("PhotoViewer");
    expect(video).not.toContain("MediaViewer");
    expect(screen).toContain("onOpenMedia");
    expect(screen).toContain("MediaViewer");
    expect(screen).toContain("isOpen={!selecting}");
  });
});
