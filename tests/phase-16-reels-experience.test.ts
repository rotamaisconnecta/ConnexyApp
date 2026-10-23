import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getReelContext } from "../src/lib/reels/reel-context";
import { ReelCategory, type Reel, type ReelAuthor } from "../src/lib/reels/reel-types";

const projectRoot = join(import.meta.dir, "..");
const AUTHOR: ReelAuthor = {
  id: "ana",
  name: "Ana",
  handle: "@ana",
  photoUrl: "/ana.jpg",
  verified: false,
  profession: null,
  isFollowing: false,
};

function reel(overrides: Partial<Reel> = {}): Reel {
  return {
    id: "reel-a",
    videoUrl: "/video.webm",
    posterUrl: null,
    caption: "Um momento",
    category: ReelCategory.MOMENT,
    author: AUTHOR,
    music: null,
    location: null,
    business: null,
    event: null,
    driver: null,
    stats: { likes: 0, comments: 0, shares: 0, saves: 0, views: 0, duration: 8 },
    hashtags: [],
    taggedUserIds: [],
    createdAt: "2026-10-08T12:00:00.000Z",
    likedByMe: false,
    savedByMe: false,
    ...overrides,
  };
}

async function source(path: string): Promise<string> {
  return readFile(join(projectRoot, path), "utf8");
}

describe("Fase 16 — Reels contextuais Connexy", () => {
  test("Reel sem associação não inventa contexto e aponta ao perfil do autor", () => {
    const context = getReelContext(reel());
    expect(context.actionLabel).toBe("Conhecer perfil");
    expect(context.actionTarget).toEqual({ type: "perfil", id: AUTHOR.id });
    expect(context.authorTarget).toEqual({ type: "perfil", id: AUTHOR.id });
  });

  test("Reel de negócio mantém ação do negócio e autor no perfil da pessoa", () => {
    const context = getReelContext(
      reel({
        category: ReelCategory.BUSINESS,
        business: {
          id: "business-42",
          name: "Café Central",
          logo: "/cafe.jpg",
          category: "Cafés",
          rating: 4.8,
          reviewCount: 12,
          isFollowing: false,
          offers: [],
        },
      }),
    );
    expect(context.actionLabel).toBe("Ver negócio");
    expect(context.actionTarget).toEqual({ type: "negocio", id: "business-42" });
    expect(context.authorTarget).toEqual({ type: "perfil", id: AUTHOR.id });
  });

  test("Reel de evento mantém ação do evento e autor no perfil da pessoa", () => {
    const context = getReelContext(
      reel({
        category: ReelCategory.EVENT,
        event: {
          id: "event-42",
          name: "Festival Conecta",
          date: "2026-10-10T20:00:00.000Z",
          location: "Centro",
          coverUrl: "/festival.jpg",
          interestedCount: 0,
          attendingCount: 0,
          isInterested: false,
          isAttending: false,
          checkedIn: false,
        },
      }),
    );
    expect(context.actionLabel).toBe("Ver evento");
    expect(context.actionTarget).toEqual({ type: "evento", id: "event-42" });
    expect(context.authorTarget).toEqual({ type: "perfil", id: AUTHOR.id });
  });

  test("Reel de local mantém ação do local e autor no perfil da pessoa", () => {
    const context = getReelContext(
      reel({
        category: ReelCategory.PLACE,
        location: {
          id: "place-42",
          name: "Praça Central",
          address: "Centro",
          lat: -1.45,
          lng: -48.49,
          category: "Praça",
          distanceMeters: 400,
        },
      }),
    );
    expect(context.actionLabel).toBe("Ver local");
    expect(context.actionTarget).toEqual({ type: "local", id: "place-42" });
    expect(context.authorTarget).toEqual({ type: "perfil", id: AUTHOR.id });
  });

  test("Reel de oferta mantém ação da oferta e autor no perfil da pessoa", () => {
    const context = getReelContext(
      reel({
        category: ReelCategory.OFFER,
        business: {
          id: "business-43",
          name: "Café Aurora",
          logo: "/aurora.jpg",
          category: "Cafés",
          rating: 4.6,
          reviewCount: 8,
          isFollowing: false,
          offers: [
            {
              id: "offer-43",
              title: "Café especial",
              description: "Oferta do dia",
              discountPercent: 10,
              validUntil: "2026-10-10T23:59:00.000Z",
            },
          ],
        },
      }),
    );
    expect(context.actionLabel).toBe("Ativar oferta");
    expect(context.actionTarget).toEqual({ type: "oferta", id: "business-43" });
    expect(context.authorTarget).toEqual({ type: "perfil", id: AUTHOR.id });
  });

  test("as ações contextuais usam as rotas existentes e o player preserva autoplay muted", async () => {
    const route = await source("src/routes/_app.reels.tsx");
    const overlay = await source("src/components/reels/reel-overlay.tsx");
    const player = await source("src/components/reels/reel-player.tsx");
    const recorder = await source("src/components/media/reel-recorder.tsx");
    expect(route).toContain('navigate({ to: "/perfil/$id", params: { id: target.id } });');
    expect(route).toContain('navigate({ to: "/local/$id", params: { id: target.id } });');
    expect(route).toContain('to: "/business/$businessId"');
    expect(route).toContain('to: "/event/$eventId"');
    expect(overlay).toContain("onOpenContext(ctx.authorTarget)");
    expect(overlay).toContain("onOpenContext(ctx.actionTarget)");
    expect(player).toContain("muted={muted}");
    expect(player).toContain('preload={isActive ? "auto" : "metadata"}');
    const previewVideo = recorder.match(/<video\s+src=\{previewUrl\}[\s\S]*?\/>/)?.[0] ?? "";
    expect(previewVideo).toContain("autoPlay");
    expect(previewVideo).toContain("muted");
    expect(previewVideo).toContain("controls");
    expect(previewVideo).toContain("playsInline");
  });

  test("o Pulse continua na Home e Reels têm entrada existente, sem carrossel de vídeo paralelo", async () => {
    const home = await source("src/components/home/HomeActionHub.tsx");
    const route = await source("src/routes/_app.reels.tsx");
    expect(home).toContain('title="Acontecendo agora"');
    expect(home).toContain('to="/reels"');
    expect(route).toContain('label="Agora"');
  });
});
