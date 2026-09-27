import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { MORE_MENU_ITEMS, MORE_MENU_LABELS } from "../src/lib/navigation/more-menu";
import { REELS_DB_NAME, reelsPersistenceSchema } from "../src/lib/persistence/domain/reels-schema";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../src/lib/reels/canonical-reel-publish-route";
import { ReelRepository } from "../src/repositories/reel.repository";
import { ReelLikeRepository } from "../src/repositories/reel-like.repository";
import { ReelCommentRepository } from "../src/repositories/reel-comment.repository";

const projectRoot = join(import.meta.dir, "..");

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

describe("Fase 1G-3 — nomenclatura de produto Agora", () => {
  test("menu Mais apresenta Agora e mantém a rota /reels", () => {
    expect([...MORE_MENU_LABELS]).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    expect(MORE_MENU_ITEMS).toHaveLength(6);
    expect(MORE_MENU_ITEMS[3]).toEqual({ id: "reel", label: "Agora", to: "/reels" });
    expect(MORE_MENU_ITEMS.map((item) => item.to)).toEqual([
      "/locais",
      "/events",
      "/marketplace",
      "/reels",
      "/marketplace",
      "/gerenciar",
    ]);
  });

  test("páginas e atalhos visíveis passam a dizer Agora", async () => {
    const feed = await source("src/routes/_app.reels.tsx");
    expect(feed).toContain('title: "Agora — Connexy"');
    expect(feed).toContain('label="Agora"');
    expect(feed).toContain("Criar no Agora");
    expect(feed).toContain("Nada no Agora");
    expect(feed).not.toContain('title: "Reels — Connexy"');
    expect(feed).not.toContain('label="Reels"');
    expect(feed).toContain('createFileRoute("/_app/reels")');

    const detail = await source("src/routes/_app/reels/$reelId.tsx");
    expect(detail).toContain('title: "Agora — Connexy"');
    expect(detail).toContain("Não encontrado no Agora");
    expect(detail).toContain('createFileRoute("/_app/reels/$reelId")');

    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).toContain('title: "Agora"');
    expect(hub).toContain("CANONICAL_REEL_PUBLISH_ROUTE");

    const publish = await source("src/routes/_app.gerenciar.novo-reel.tsx");
    expect(publish).toContain("Novo no Agora");
    expect(publish).toContain("Publicar no Agora");
    expect(CANONICAL_REEL_PUBLISH_ROUTE).toBe("/gerenciar/novo-reel");
  });

  test("source of truth e repositórios internos continuam Reel", async () => {
    expect(REELS_DB_NAME).toBe("connexy-reels-data-local-db");
    expect(reelsPersistenceSchema.name).toBe("connexy-reels-data-local-db");
    expect(ReelRepository.name).toBe("ReelRepository");
    expect(ReelLikeRepository.name).toBe("ReelLikeRepository");
    expect(ReelCommentRepository.name).toBe("ReelCommentRepository");

    const schema = await source("src/lib/persistence/domain/reels-schema.ts");
    expect(schema).toContain("connexy-reels-data-local-db");
    expect(schema).not.toContain("connexy-agora-data-local-db");

    const media = await source("src/lib/reels/reel-local-media-db.ts");
    expect(media).toContain('const DB_NAME = "connexy-reels-local-db"');
    expect(media).not.toContain("connexy-agora");

    const repoFiles = await readdir(join(projectRoot, "src/repositories"));
    expect(repoFiles).toContain("reel.repository.ts");
    expect(repoFiles).toContain("reel-like.repository.ts");
    expect(repoFiles).toContain("reel-comment.repository.ts");
    expect(repoFiles.some((file) => file.toLowerCase().includes("agora"))).toBe(false);
  });
});
