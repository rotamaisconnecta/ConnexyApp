import { describe, expect, test } from "bun:test";
import { SPONSORED_ADS } from "../src/lib/ads/mock-sponsored-content";
import {
  isSponsoredPlacement,
  selectEligibleSponsored,
  type SponsoredPlacement,
} from "../src/lib/ads/sponsored-placement";
import { sponsoredContentToPlacement, listPostRideDiscovery, listPostRideSponsoredPlaces } from "../src/lib/mobility/post-ride-discovery";
import { places } from "../src/lib/mock-data";
import {
  buildRecommendationCards,
  buildTrendingCards,
} from "../src/lib/feed/home-premium";

function sponsored(id: string, overrides: Partial<SponsoredPlacement> = {}): SponsoredPlacement {
  return {
    id,
    name: id,
    image: "/ad.jpg",
    category: "Local",
    distanceMeters: 100,
    targetType: "business",
    targetId: id,
    sponsored: true,
    ...overrides,
  };
}

const NOW = new Date("2026-10-08T12:00:00.000Z");

describe("Fase 18C — seleção patrocinada compartilhada", () => {
  test("seleciona inventário elegível e filtra campanha explicitamente inativa", () => {
    const result = selectEligibleSponsored(
      [sponsored("eligible"), sponsored("inactive", { active: false })],
      { now: NOW },
    );
    expect(result.map((item) => item.id)).toEqual(["eligible"]);
  });

  test("aplica agenda com limites inclusivos e rejeita datas inválidas", () => {
    const result = selectEligibleSponsored(
      [
        sponsored("inside", {
          startsAt: "2026-10-08T12:00:00.000Z",
          endsAt: "2026-10-08T12:00:00.000Z",
        }),
        sponsored("not-started", { startsAt: "2026-10-08T12:00:00.001Z" }),
        sponsored("ended", { endsAt: "2026-10-08T11:59:59.999Z" }),
        sponsored("invalid-date", { startsAt: "invalid" }),
      ],
      { now: NOW },
    );
    expect(result.map((item) => item.id)).toEqual(["inside"]);
  });

  test("prioridade sem semântica operacional confirmada não sobrepõe proximidade nem relevância", () => {
    const input = [
      sponsored("far-high", { priority: 3, distanceMeters: 900 }),
      sponsored("near-high", { priority: 3, distanceMeters: 100 }),
      sponsored("near-normal", { distanceMeters: 10 }),
    ];
    expect(selectEligibleSponsored(input, { now: NOW }).map((item) => item.id)).toEqual([
      "near-normal",
      "near-high",
      "far-high",
    ]);
    expect(selectEligibleSponsored(input, { now: NOW })).toHaveLength(3);
  });

  test("aplica raio apenas com localização válida e mantém fallback sem ela", () => {
    const input = [
      sponsored("inside", { geoRadiusMeters: 500, distanceMeters: 400 }),
      sponsored("outside", { geoRadiusMeters: 500, distanceMeters: 600 }),
    ];
    expect(selectEligibleSponsored(input, { now: NOW, locationAvailable: true }).map((item) => item.id))
      .toEqual(["inside"]);
    expect(selectEligibleSponsored(input, { now: NOW, locationAvailable: false }).map((item) => item.id))
      .toEqual(["inside", "outside"]);
  });

  test("preserva orgânicos, deduplica por ID apenas e não duplica anúncios por posicionamento", () => {
    const selection = selectEligibleSponsored(
      [sponsored("same-a"), sponsored("same-b"), sponsored("same-a")],
      { now: NOW },
    );
    expect(selection.map((item) => item.id)).toEqual(["same-a", "same-b"]);
    const legacyIds = new Set(SPONSORED_ADS.map((ad) => ad.id));
    expect(SPONSORED_ADS).toHaveLength(6);
    expect(legacyIds.size).toBe(6);
    const mixed = listPostRideDiscovery({ lat: -23.55, lng: -46.64, label: "Destino" });
    expect(mixed.some((item) => item.sponsored === false)).toBe(true);
    expect(mixed.some(isSponsoredPlacement)).toBe(true);
    expect(mixed.filter(isSponsoredPlacement).every((item) => legacyIds.has(item.id))).toBe(true);
  });

  test("converte os anúncios legados sem perder dados e mantém seleção pós-viagem contextual", () => {
    const converted = sponsoredContentToPlacement(SPONSORED_ADS[0]);
    expect(converted.id).toBe(SPONSORED_ADS[0].id);
    expect(converted.name).toBe(SPONSORED_ADS[0].title);
    expect(converted.sponsored).toBe(true);
    expect(converted.active).toBeUndefined();
    expect(listPostRideSponsoredPlaces({ lat: -23.55, lng: -46.64, label: "Destino" })).toHaveLength(2);
  });

  test("Home preserva raio de 2 km/fallback; classificação orgânica e badge 18A permanecem válidos", async () => {
    const feed = await Bun.file(new URL("../src/components/ads/LocalSponsoredFeed.tsx", import.meta.url)).text();
    expect(feed).toContain("liveDistanceMeters <= 2_000");
    expect(feed).toContain("ranked.slice(0, 3)");

    const eventPlace = places.find((place) => place.category === "Eventos");
    expect(eventPlace).toBeDefined();
    const organicEvent = buildRecommendationCards().find((card) => card.route === `/local/${eventPlace!.id}`);
    expect(organicEvent?.kind).toBe("event");
    expect(organicEvent?.badge).not.toBe("Patrocinado");
    expect(buildTrendingCards().every((card) => card.badge !== "Patrocinado")).toBe(true);
  });

});
