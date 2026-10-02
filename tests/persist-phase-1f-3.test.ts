import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CANONICAL_POST_PUBLISH_ROUTE,
  CANONICAL_RIDE_CREATE_ROUTE,
  CREATE_TYPE_UNAVAILABLE_MESSAGE,
} from "../src/lib/create/create-hub-destinations";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "../src/lib/reels/canonical-reel-publish-route";
import { CREATE_REEL_REDIRECT_TO } from "../src/routes/_app/create/reel";
import {
  CREATE_PHOTO_REDIRECT_TO,
  Route as CreatePhotoRoute,
} from "../src/routes/_app/create/photo";
import {
  CREATE_VIDEO_REDIRECT_TO,
  Route as CreateVideoRoute,
} from "../src/routes/_app/create/video";
import { CREATE_TEXT_REDIRECT_TO, Route as CreateTextRoute } from "../src/routes/_app/create/text";
import { CREATE_RIDE_REDIRECT_TO, Route as CreateRideRoute } from "../src/routes/_app/create/ride";
import { Route as CreateEventRoute } from "../src/routes/_app/create/event";
import { Route as CreatePlaceRoute } from "../src/routes/_app/create/place";
import { Route as CreateOfferRoute } from "../src/routes/_app/create/offer";
import {
  CREATE_MOMENT_REDIRECT_TO,
  Route as CreateMomentRoute,
} from "../src/routes/_app/create/moment";
import { Route as CreatePostRoute } from "../src/routes/_app/create-post";
import { Route as RideRequestRoute } from "../src/routes/_app/ride/request";
import { demoStorageKey } from "../src/lib/demo/demo-config";

const projectRoot = join(import.meta.dir, "..");

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

describe("Fase 1F-3 — Create Hub tipos restantes", () => {
  test("Create Hub aponta Reel para o fluxo canônico", async () => {
    expect(CANONICAL_REEL_PUBLISH_ROUTE).toBe("/gerenciar/novo-reel");
    expect(CREATE_REEL_REDIRECT_TO).toBe("/gerenciar/novo-reel");
    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).toContain("CANONICAL_REEL_PUBLISH_ROUTE");
    expect(hub).not.toContain('route: "/create/reel"');
  });

  test("/create/reel continua redirecionando para o fluxo canônico", async () => {
    const reel = await source("src/routes/_app/create/reel.tsx");
    expect(reel).toContain("redirect");
    expect(reel).not.toContain("usePublisherForm");
    expect(reel).not.toContain("Publicando...");
  });

  test("photo, video e text apontam para a publicação local já existente", async () => {
    expect(CANONICAL_POST_PUBLISH_ROUTE).toBe("/create-post");
    expect(CREATE_PHOTO_REDIRECT_TO).toBe("/create-post");
    expect(CREATE_VIDEO_REDIRECT_TO).toBe("/create-post");
    expect(CREATE_TEXT_REDIRECT_TO).toBe("/create-post");
    expect(typeof CreatePhotoRoute.options.loader).toBe("function");
    expect(typeof CreateVideoRoute.options.loader).toBe("function");
    expect(typeof CreateTextRoute.options.loader).toBe("function");
    expect(CreatePostRoute.options.component).toBeDefined();

    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).toContain("CANONICAL_POST_PUBLISH_ROUTE");
    expect(hub).not.toContain('route: "/create/photo"');
    expect(hub).not.toContain('route: "/create/video"');
    expect(hub).not.toContain('route: "/create/text"');

    for (const file of [
      "src/routes/_app/create/photo.tsx",
      "src/routes/_app/create/video.tsx",
      "src/routes/_app/create/text.tsx",
    ]) {
      const contents = await source(file);
      expect(contents).toContain("redirect");
      expect(contents).not.toContain("usePublisherForm");
      expect(contents).not.toContain("Publicando...");
      expect(contents).not.toContain("Publicado com sucesso!");
    }
  });

  test("moment aponta para a publicação local já existente", async () => {
    expect(CREATE_MOMENT_REDIRECT_TO).toBe("/create-post");
    expect(typeof CreateMomentRoute.options.loader).toBe("function");
    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).not.toContain('route: "/create/moment"');
    const contents = await source("src/routes/_app/create/moment.tsx");
    expect(contents).toContain("redirect");
    expect(contents).toContain("CANONICAL_MOMENT_CATEGORY");
    expect(contents).not.toContain("usePublisherForm");
    expect(contents).not.toContain("CreateTypeUnavailable");
    expect(contents).not.toContain("Publicando...");
  });

  test("ride reutiliza o fluxo de Mobility existente", async () => {
    expect(CANONICAL_RIDE_CREATE_ROUTE).toBe("/ride/request");
    expect(CREATE_RIDE_REDIRECT_TO).toBe("/ride/request");
    expect(typeof CreateRideRoute.options.loader).toBe("function");
    expect(RideRequestRoute.options.component).toBeDefined();
    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).toContain("Pedir corrida");
    expect(hub).toContain("CANONICAL_RIDE_CREATE_ROUTE");
    expect(hub).not.toContain("Passageiro");
    expect(hub).not.toContain("Motorista");
    const contents = await source("src/routes/_app/create/ride.tsx");
    expect(contents).toContain("redirect");
    expect(contents).not.toContain("usePublisherForm");
    expect(contents).not.toContain("Publicando...");
  });

  test("event, place, offer e negócio usam o catálogo local persistente", async () => {
    expect(CREATE_TYPE_UNAVAILABLE_MESSAGE).toContain("ainda não está disponível");
    expect(CreateEventRoute.options.component).toBeDefined();
    expect(CreatePlaceRoute.options.component).toBeDefined();
    expect(CreateOfferRoute.options.component).toBeDefined();

    const hub = await source("src/routes/_app/create.tsx");
    expect(hub).toContain("catálogo local");
    expect(hub).not.toContain("CREATE_TYPE_UNAVAILABLE_MESSAGE");

    for (const file of [
      "src/routes/_app/create/event.tsx",
      "src/routes/_app/create/place.tsx",
      "src/routes/_app/create/offer.tsx",
      "src/routes/_app/create/place-business.tsx",
    ]) {
      const contents = await source(file);
      expect(contents).toContain("CatalogCreateForm");
      expect(contents).not.toContain("CreateTypeUnavailable");
      expect(contents).not.toContain("usePublisherForm");
      expect(contents).not.toContain("Publicando...");
      expect(contents).not.toContain("Publicado com sucesso!");
      expect(contents).not.toContain("saveDemoPost");
    }
  });

  test("não cria persistência nova nem fonte paralela", async () => {
    expect(demoStorageKey("posts")).toBe("connexy:demo:posts");
    const createPost = await source("src/routes/_app/create-post.tsx");
    expect(createPost).toContain("saveDemoPost");
    expect(createPost).not.toContain("supabase.from");
    expect(createPost).not.toContain("supabase.auth");

    const destinations = await source("src/lib/create/create-hub-destinations.ts");
    expect(destinations).not.toContain("indexedDB");
    expect(destinations).not.toContain("localStorage");
    expect(destinations).not.toContain("supabase");
  });

  test("usePublisherForm não permanece nos tipos do Create Hub", async () => {
    const hubRoutes = [
      "src/routes/_app/create.tsx",
      "src/routes/_app/create/photo.tsx",
      "src/routes/_app/create/video.tsx",
      "src/routes/_app/create/text.tsx",
      "src/routes/_app/create/event.tsx",
      "src/routes/_app/create/place.tsx",
      "src/routes/_app/create/offer.tsx",
      "src/routes/_app/create/ride.tsx",
      "src/routes/_app/create/moment.tsx",
      "src/routes/_app/create/place-business.tsx",
      "src/routes/_app/create/reel.tsx",
    ];
    for (const file of hubRoutes) {
      const contents = await source(file);
      expect(contents).not.toContain("usePublisherForm");
    }
  });
});
