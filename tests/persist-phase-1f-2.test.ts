import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../src/lib/reels/canonical-reel-publish-route";
import { CREATE_REEL_REDIRECT_TO, Route as CreateReelRoute } from "../src/routes/_app/create/reel";
import { Route as NovoReelRoute } from "../src/routes/_app.gerenciar.novo-reel";
import { reelsPersistenceSchema } from "../src/lib/persistence/domain/reels-schema";
import { REEL_STORE } from "../src/lib/persistence/domain/reels-schema";

const projectRoot = join(import.meta.dir, "..");

describe("Fase 1F-2 — Create Hub canônico de Reel", () => {
  test("Create Hub aponta Reel para /gerenciar/novo-reel", async () => {
    expect(CANONICAL_REEL_PUBLISH_ROUTE).toBe("/gerenciar/novo-reel");
    const hub = await readFile(join(projectRoot, "src/routes/_app/create.tsx"), "utf8");
    expect(hub).toContain("CANONICAL_REEL_PUBLISH_ROUTE");
    expect(hub).not.toContain('route: "/create/reel"');
  });

  test("/create/reel redireciona e não usa publicação falsa", async () => {
    expect(CREATE_REEL_REDIRECT_TO).toBe("/gerenciar/novo-reel");
    expect(typeof CreateReelRoute.options.loader).toBe("function");
    const source = await readFile(join(projectRoot, "src/routes/_app/create/reel.tsx"), "utf8");
    expect(source).not.toContain("usePublisherForm");
    expect(source).not.toContain("Publicando...");
    expect(source).not.toContain("Publicado com sucesso!");
    expect(source).toContain("redirect");
  });

  test("o fluxo canônico /gerenciar/novo-reel continua acessível", async () => {
    expect(NovoReelRoute.options.component).toBeDefined();
    const source = await readFile(
      join(projectRoot, "src/routes/_app.gerenciar.novo-reel.tsx"),
      "utf8",
    );
    expect(source).toContain("publishReel");
    expect(source).not.toContain("usePublisherForm");
  });

  test("a persistência canônica de Reels permanece a mesma", () => {
    expect(reelsPersistenceSchema.name).toBe("connexy-reels-data-local-db");
    expect(REEL_STORE).toBe("reels");
  });
});
