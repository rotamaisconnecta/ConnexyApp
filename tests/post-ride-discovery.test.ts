import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DEFAULT_PLACEMENT_PATTERN,
  interleavePlacements,
  isSponsoredPlacement,
  type OrganicPlacement,
  type SponsoredPlacement,
} from "../src/lib/ads/sponsored-placement";
import {
  connexyPointsForFare,
  formatPostRideDistance,
  listPostRideDiscovery,
  ratingFeedbackLabel,
  resolvePostRideNavigation,
} from "../src/lib/mobility/post-ride-discovery";

function organic(id: string): OrganicPlacement {
  return {
    id,
    name: id,
    image: "https://example.com/p.jpg",
    category: "Cafés",
    distanceMeters: 100,
    rating: 4.8,
    targetType: "place",
    targetId: id,
    sponsored: false,
  };
}

function sponsored(id: string): SponsoredPlacement {
  return {
    id,
    name: id,
    image: "https://example.com/ad.jpg",
    category: "Lojas",
    distanceMeters: 200,
    targetType: "business",
    targetId: id,
    sponsored: true,
    active: true,
  };
}

describe("placement patrocinado pós-viagem", () => {
  test("intercala patrocinado e orgânico sem misturar sem controle", () => {
    const mixed = interleavePlacements(
      [organic("o1"), organic("o2"), organic("o3")],
      [sponsored("s1"), sponsored("s2")],
      DEFAULT_PLACEMENT_PATTERN,
    );
    expect(mixed.map((item) => item.id)).toEqual(["s1", "o1", "s2", "o2", "o3"]);
    expect(mixed.filter(isSponsoredPlacement)).toHaveLength(2);
    expect(mixed.filter((item) => !item.sponsored)).toHaveLength(3);
  });

  test("não inventa patrocinado quando a lista paga está vazia", () => {
    const mixed = interleavePlacements([organic("o1"), organic("o2")], []);
    expect(mixed.every((item) => item.sponsored === false)).toBe(true);
    expect(mixed.map((item) => item.id)).toEqual(["o1", "o2"]);
  });

  test("ignora campanha patrocinada desativada", () => {
    const inactive = { ...sponsored("off"), active: false };
    const mixed = interleavePlacements([organic("o1")], [inactive, sponsored("on")]);
    expect(mixed.map((item) => item.id)).toEqual(["on", "o1"]);
  });

  test("pontos, feedback e distância usam dados reais da viagem", () => {
    expect(connexyPointsForFare(24.3)).toBe(24);
    expect(connexyPointsForFare(0)).toBe(0);
    expect(ratingFeedbackLabel(5)).toBe("Excelente!");
    expect(ratingFeedbackLabel(0)).toBe("");
    expect(formatPostRideDistance(300)).toBe("300 m");
    expect(formatPostRideDistance(1200)).toBe("1,2 km");
  });

  test("a lista da tela mistura catálogo orgânico com inventário patrocinado", () => {
    const destination = { lat: -23.55, lng: -46.64, label: "Destino" };
    const cards = listPostRideDiscovery(destination);
    expect(cards.length).toBeGreaterThan(2);
    expect(cards.some(isSponsoredPlacement)).toBe(true);
    expect(cards.some((item) => item.sponsored === false)).toBe(true);
    const firstSponsored = cards.find(isSponsoredPlacement);
    expect(firstSponsored).toBeDefined();
    expect(resolvePostRideNavigation(firstSponsored!)).not.toBeNull();
    const firstOrganic = cards.find((item) => !item.sponsored);
    expect(resolvePostRideNavigation(firstOrganic!)?.href).toContain("/local/");
  });
});

describe("tela visual — viagem concluída", () => {
  test("reusa o RatingPanel existente com a hierarquia da referência", async () => {
    const panel = await readFile(
      join(import.meta.dir, "../src/components/mobility/ride/ride-live-panels.tsx"),
      "utf8",
    );
    const start = panel.indexOf("const RATING_CHIPS_POSITIVE");
    const end = panel.indexOf("export function FinalPanel");
    const rating = panel.slice(start, end);
    expect(rating).toContain("Viagem concluída!");
    expect(rating).toContain("Obrigado por escolher a Connexy.");
    expect(rating).toContain("Como foi sua viagem?");
    expect(rating).toContain("Avalie seu motorista");
    expect(rating).toContain("Motorista educado");
    expect(rating).toContain("Deixe um comentário (opcional)");
    expect(rating).toContain("Lugares perto do seu destino");
    expect(rating).toContain("Patrocinado");
    expect(rating).toContain("listPostRideDiscovery");
    expect(rating).toContain("connexyPointsForFare");
    expect(rating).toContain("Finalizar");
    expect(rating).toContain("onSend");
    expect(rating).not.toContain("Agora não");
    expect(rating).not.toContain("Enviar avaliação");
    expect(rating).not.toContain("Rafael Souza");
    expect(rating).not.toContain("Chevrolet Onix");
    expect(rating).not.toContain("R$ 24,30");
    expect(rating).toContain("postRideCategoryIcon");
    expect(rating).toContain("rounded-full");
  });

  test("a conclusão ocupa a tela inteira sem mapa atrás", async () => {
    const flow = await readFile(
      join(import.meta.dir, "../src/components/mobility/ride/ride-flow.tsx"),
      "utf8",
    );
    expect(flow).toContain('flowState !== "avaliacao" && flowState !== "conclusao"');
  });
});
