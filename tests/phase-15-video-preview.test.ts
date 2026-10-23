import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..");

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

describe("Fase 15 — preview de vídeo antes do envio/publicação", () => {
  test("MediaRecorder cria Blob e URL local para o preview", async () => {
    const recorder = await source("src/components/media/reel-recorder.tsx");
    expect(recorder).toContain("new Blob(chunksRef.current, { type })");
    expect(recorder).toContain("URL.createObjectURL(blob)");
    expect(recorder).toContain("setPreviewUrl");
    expect(recorder).toContain("setClip({\n        blob,");
  });

  test("preview gravado pode iniciar sem bloqueio de autoplay com áudio", async () => {
    const recorder = await source("src/components/media/reel-recorder.tsx");
    const previewVideo = recorder.match(/<video\s+src=\{previewUrl\}[\s\S]*?\/>/)?.[0] ?? "";
    expect(previewVideo).toContain("autoPlay");
    expect(previewVideo).toContain("muted");
    expect(previewVideo).toContain("controls");
    expect(previewVideo).toContain("playsInline");
  });

  test("URL permanece disponível até refazer ou desmontar o preview", async () => {
    const recorder = await source("src/components/media/reel-recorder.tsx");
    expect(recorder).toContain("if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)");
    expect(recorder).toContain("if (previewUrl) URL.revokeObjectURL(previewUrl)");
    expect(recorder).toContain("previewUrlRef.current = null");
  });

  test("Chat usa o preview compartilhado e só envia após confirmar", async () => {
    const chat = await source("src/components/chat/ConnexyChatScreen.tsx");
    expect(chat).toContain("<ReelRecorder");
    expect(chat).toContain('onUse={(clip) => void handleRecordedVideo(clip)}');
    expect(chat).toContain('kind: "video",\n        blob: clip.blob');
  });

  test("Reels usa o preview compartilhado antes de converter e publicar", async () => {
    const page = await source("src/routes/_app.gerenciar.novo-reel.tsx");
    expect(page).toContain("<ReelRecorder");
    expect(page).toContain("onUse={handleRecordedClip}");
    expect(page).toContain("const file = new File([clip.blob], clip.fileName");
    expect(page).toContain("publishReel({");
  });

  test("fluxos confirmados de envio e publicação continuam usando os Blobs originais", async () => {
    const chat = await source("src/components/chat/ConnexyChatScreen.tsx");
    const page = await source("src/routes/_app.gerenciar.novo-reel.tsx");
    expect(chat).toContain("await sendMedia({\n        kind: \"video\",\n        blob: clip.blob");
    expect(page).toContain("new File([clip.blob], clip.fileName");
    expect(page).toContain("await publishReel({");
  });
});
