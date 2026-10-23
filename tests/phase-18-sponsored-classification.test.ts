import { describe, expect, test } from "bun:test";
import {
  buildRecommendationCards,
  buildTrendingCards,
  KIND_LABELS,
  scorePremiumCard,
  type PremiumCard,
} from "../src/lib/feed/home-premium";
import { places } from "../src/lib/mock-data";

describe("Fase 18A — classificação de conteúdo patrocinado", () => {
  test("existe um local orgânico de categoria Eventos nos dados", () => {
    const eventPlace = places.find((place) => place.category === "Eventos");
    expect(eventPlace).toBeDefined();
    expect(eventPlace?.id).toBe("sunset-parque");
  });

  test("eventos orgânicos não recebem classificação nem badge de patrocinado", () => {
    const recommendations = buildRecommendationCards();

    for (const card of recommendations) {
      if (card.id === "hotel-prime") continue;
      expect(card.kind).not.toBe("sponsored-event");
      expect(card.badge).not.toBe("Patrocinado");
      expect(card.badge).not.toBe("Evento patrocinado");
    }

    const trending = buildTrendingCards();
    for (const card of trending) {
      expect(card.kind).not.toBe("sponsored-event");
      expect(card.badge).not.toBe("Patrocinado");
    }
  });

  test("o evento orgânico da categoria Eventos mantém rótulo de evento", () => {
    const placeCards = buildRecommendationCards().filter(
      (card) => card.route === "/local/sunset-parque",
    );
    expect(placeCards.length).toBeGreaterThan(0);
    for (const card of placeCards) {
      expect(card.title).toBe("Sunset no Parque");
      expect(card.kind).toBe("event");
      expect(card.badge).toBeUndefined();
    }
  });

  test("conteúdo efetivamente patrocinado mantém badge e classificação", () => {
    const sponsored = buildRecommendationCards().filter((card) => card.badge === "Patrocinado");
    expect(sponsored).toHaveLength(1);
    expect(sponsored[0].id).toBe("hotel-prime");
  });

  test("um evento realmente patrocinado continua identificável pela fonte confiável", () => {
    const sponsoredEvent: PremiumCard = {
      id: "event-premium",
      kind: "sponsored-event",
      title: "Festival Conecta Premium",
      badge: "Patrocinado",
      route: "/event/festival-conecta",
    };

    expect(KIND_LABELS["sponsored-event"]).toBe("Evento patrocinado");
    expect(scorePremiumCard(sponsoredEvent)).toBe(scorePremiumCard({ ...sponsoredEvent, badge: undefined }) + 10);
  });

  test("evento orgânico não recebe bônus de ranking de patrocinado", () => {
    const organic: PremiumCard = {
      id: "event-free",
      kind: "event",
      title: "Feira Gastronomica",
      route: "/event/ev2",
      rating: 4.2,
      distanceMeters: 1200,
    };

    expect(scorePremiumCard(organic)).toBe(scorePremiumCard({ ...organic, badge: "Patrocinado" }) - 10);
    expect(scorePremiumCard(organic)).toBe(scorePremiumCard({ ...organic, badge: "Em alta" }));
  });

  test("ordenar e apresentar os feeds não sofre regressão", () => {
    const first = buildRecommendationCards().map((card) => card.id);
    const second = buildRecommendationCards().map((card) => card.id);
    expect(first).toEqual(second);
    expect(first).toHaveLength(18);

    const trending = buildTrendingCards();
    expect(trending).toHaveLength(16);
    expect(new Set(trending.map((card) => card.id)).size).toBe(trending.length);
  });
});