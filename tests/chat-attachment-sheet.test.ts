import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ATTACHMENT_OPTIONS, MessageKind } from "../src/lib/chat/chat-types";

const projectRoot = join(import.meta.dir, "..");

describe("Bottom sheet de Anexar", () => {
  test("mantém as quatro ações sem Áudio", () => {
    expect(ATTACHMENT_OPTIONS.map((item) => item.label)).toEqual([
      "Galeria",
      "Arquivo",
      "Localização",
      "Evento ou local",
    ]);
    expect(ATTACHMENT_OPTIONS.map((item) => item.kind)).toEqual([
      MessageKind.IMAGE,
      MessageKind.FILE,
      MessageKind.LOCATION,
      "share-content",
    ]);
  });

  test("o painel só representa as opções e dispara onSelect", async () => {
    const sheet = await readFile(
      join(projectRoot, "src/components/chat/attachment-sheet.tsx"),
      "utf8",
    );
    const input = await readFile(
      join(projectRoot, "src/components/chat/message-input.tsx"),
      "utf8",
    );
    expect(sheet).toContain("ATTACHMENT_OPTIONS.map");
    expect(sheet).toContain("onSelect(opt.kind)");
    expect(sheet).not.toContain("handleOpenAttachment");
    expect(sheet).not.toContain("mediaInputRef");
    expect(sheet).toContain('aria-labelledby="attach-sheet-title"');
    expect(input).toContain("onOpenAttachment(kind)");
    expect(input).toContain("setShowAttach(false)");
  });
});
