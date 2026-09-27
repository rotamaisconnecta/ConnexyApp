import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CANONICAL_POST_PUBLISH_ROUTE,
  CREATE_TYPE_UNAVAILABLE_MESSAGE,
} from "../src/lib/create/create-hub-destinations";
import { LOCAL_CATALOG_DISCLAIMER } from "../src/lib/catalog/local-catalog";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../src/lib/reels/canonical-reel-publish-route";
import { Route as CreateEventRoute } from "../src/routes/_app/create/event";
import { Route as CreatePlaceRoute } from "../src/routes/_app/create/place";
import { Route as CreateOfferRoute } from "../src/routes/_app/create/offer";
import { Route as CreateBusinessRoute } from "../src/routes/_app/create/place-business";
import { Route as NovoReelRoute } from "../src/routes/_app.gerenciar.novo-reel";
import { demoStorageKey } from "../src/lib/demo/demo-config";

const projectRoot = join(import.meta.dir, "..");

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

describe("Fase 1F-4 — Meu Connexy sem wizards falsos", () => {
  test("Meu Connexy abre e não executa wizard de cadastro", async () => {
    const page = await source("src/routes/_app/my-connexy.tsx");
    expect(page).toContain("Meu Connexy");
    expect(page).toContain("/_app/my-connexy");
    expect(page).not.toContain("WizardBase");
    expect(page).not.toContain("onComplete");
    expect(page).not.toContain("handleWizardComplete");
    expect(page).not.toContain("Publicar");
    expect(page).not.toContain("Cadastro realizado");
    expect(page).not.toContain("2.4k");
    expect(page).not.toContain("Sunset no Parque");
  });

  test("negócio, evento, local e oferta apontam para o catálogo local", async () => {
    expect(CREATE_TYPE_UNAVAILABLE_MESSAGE).toContain("ainda não está disponível");
    expect(LOCAL_CATALOG_DISCLAIMER).toContain("Cadastro local/demo");
    expect(CreateBusinessRoute.options.component).toBeDefined();
    expect(CreateEventRoute.options.component).toBeDefined();
    expect(CreatePlaceRoute.options.component).toBeDefined();
    expect(CreateOfferRoute.options.component).toBeDefined();

    const page = await source("src/routes/_app/my-connexy.tsx");
    expect(page).toContain('to: "/create/place-business"');
    expect(page).toContain('to: "/create/event"');
    expect(page).toContain('to: "/create/place"');
    expect(page).toContain('to: "/create/offer"');
    expect(page).toContain("LOCAL_CATALOG_DISCLAIMER");
    expect(page).not.toContain("CREATE_TYPE_UNAVAILABLE_MESSAGE");

    for (const file of [
      "src/routes/_app/create/place-business.tsx",
      "src/routes/_app/create/event.tsx",
      "src/routes/_app/create/place.tsx",
      "src/routes/_app/create/offer.tsx",
    ]) {
      const contents = await source(file);
      expect(contents).toContain("CatalogCreateForm");
      expect(contents).not.toContain("CreateTypeUnavailable");
      expect(contents).not.toContain("usePublisherForm");
      expect(contents).not.toContain("Publicando...");
      expect(contents).not.toContain("Publicado com sucesso!");
    }
  });

  test("Gerenciar não apresenta cadastros de catálogo fixture como se fossem do usuário", async () => {
    const page = await source("src/routes/_app.gerenciar.tsx");
    expect(page).toContain("LOCAL_CATALOG_DISCLAIMER");
    expect(page).toContain('createRoute: "/create/place-business"');
    expect(page).toContain('createRoute: "/create/event"');
    expect(page).toContain('createRoute: "/create/place"');
    expect(page).toContain('createRoute: "/create/offer"');
    expect(page).toContain('createRoute: "/driver"');
    expect(page).not.toContain("PresenceAnalytics");
    expect(page).not.toContain("cafe-central");
    expect(page).not.toContain("evt-1");
  });

  test("fluxos funcionais de Reel e publicação continuam acessíveis", async () => {
    expect(CANONICAL_REEL_PUBLISH_ROUTE).toBe("/gerenciar/novo-reel");
    expect(CANONICAL_POST_PUBLISH_ROUTE).toBe("/create-post");
    expect(NovoReelRoute.options.component).toBeDefined();
    const gerenciar = await source("src/routes/_app.gerenciar.tsx");
    expect(gerenciar).toContain("/gerenciar/novo-reel");
    expect(gerenciar).toContain("/gerenciar/nova-foto");
    const reel = await source("src/routes/_app.gerenciar.novo-reel.tsx");
    expect(reel).toContain("publishReel");
  });

  test("não cria persistência nova nem fonte paralela", async () => {
    expect(demoStorageKey("posts")).toBe("connexy:demo:posts");
    const myConnexy = await source("src/routes/_app/my-connexy.tsx");
    expect(myConnexy).not.toContain("localStorage");
    expect(myConnexy).not.toContain("indexedDB");
    expect(myConnexy).not.toContain("supabase");
    const gerenciar = await source("src/routes/_app.gerenciar.tsx");
    expect(gerenciar).not.toContain("supabase.from");
  });
});
