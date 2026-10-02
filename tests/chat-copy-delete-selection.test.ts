import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..");

describe("Copiar e Excluir condicionados à seleção", () => {
  test("a bolha não expõe Copiar/Excluir no estado normal", async () => {
    const bubble = await readFile(join(projectRoot, "src/components/chat/message-bubble.tsx"), "utf8");
    expect(bubble).not.toContain("Copiar");
    expect(bubble).not.toContain("Excluir");
    expect(bubble).not.toContain("Mensagem copiada.");
  });

  test("Copiar e Excluir só existem na barra de seleção", async () => {
    const header = await readFile(join(projectRoot, "src/components/chat/chat-header.tsx"), "utf8");
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    const selectingBlock = header.slice(header.indexOf("if (selecting)"), header.indexOf("const status"));
    expect(selectingBlock).toContain('aria-label="Copiar"');
    expect(selectingBlock).toContain('aria-label="Excluir"');
    expect(header.indexOf('aria-label="Copiar"')).toBeGreaterThan(header.indexOf("if (selecting)"));
    expect(header.indexOf('aria-label="Copiar"')).toBeLessThan(header.indexOf("const status"));
    expect(screen).toContain("handleCopySelected");
    expect(screen).toContain("canCopySelected");
    expect(screen).toContain("requestDeleteMessages(selectedMessages)");
    expect(screen).toContain('toast.success("Copiado")');
  });

  test("abrir foto usa MediaViewer com Baixar e Excluir, sem Copiar", async () => {
    const image = await readFile(join(projectRoot, "src/components/chat/image-message.tsx"), "utf8");
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    const viewer = await readFile(join(projectRoot, "src/components/system/media-viewer.tsx"), "utf8");
    expect(image).toContain("onOpenMedia");
    expect(image).not.toContain("PhotoViewer");
    expect(screen).toContain("MediaViewer");
    expect(screen).toContain("variant=\"chat\"");
    expect(viewer).toContain('label="Baixar"');
    expect(viewer).toContain('label="Excluir"');
    expect(viewer).not.toContain("Copiar");
  });
});
