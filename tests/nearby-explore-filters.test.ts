import { describe, expect, test } from "bun:test";
import {
  applyNearbyExploreFilters,
  countNearbyFilters,
  cloneNearbyFilters,
  DEFAULT_NEARBY_FILTERS,
  isPlaceOpenNow,
  matchesEventWhen,
} from "../src/lib/discover/nearby-explore-filters";

describe("Filtros de Explorar por perto", () => {
  test("conta e limpa filtros por contexto", () => {
    const people = {
      ...cloneNearbyFilters(),
      maxDistanceMeters: 2000,
      ageMin: 20,
      ageMax: 30,
      interests: ["Música"],
    };
    expect(countNearbyFilters(people, "pessoas")).toBe(3);
    expect(countNearbyFilters(people, "locais")).toBe(1);
    expect(countNearbyFilters(DEFAULT_NEARBY_FILTERS, "pessoas")).toBe(0);
  });

  test("filtra pessoas por distância, idade e interesses", () => {
    const items = [
      { type: "pessoas" as const, distanceMeters: 400, age: 26, interests: ["Música", "Café"] },
      { type: "pessoas" as const, distanceMeters: 4000, age: 26, interests: ["Música"] },
      { type: "pessoas" as const, distanceMeters: 400, age: 42, interests: ["Música"] },
      { type: "pessoas" as const, distanceMeters: 400, age: 26, interests: ["Games"] },
    ];
    const filtered = applyNearbyExploreFilters(
      items,
      {
        ...DEFAULT_NEARBY_FILTERS,
        maxDistanceMeters: 2000,
        ageMin: 18,
        ageMax: 35,
        interests: ["Música"],
      },
      "pessoas",
    );
    expect(filtered).toEqual([items[0]]);
  });

  test("lugares abertos agora e eventos de hoje usam dados existentes", () => {
    expect(isPlaceOpenNow("Aberto até 23:00")).toBe(true);
    expect(isPlaceOpenNow("Fechado")).toBe(false);
    const now = new Date("2026-09-29T15:00:00");
    expect(
      matchesEventWhen({
        when: "today",
        startAt: "2026-09-29T18:00:00",
        now,
      }),
    ).toBe(true);
    expect(
      matchesEventWhen({
        when: "tomorrow",
        startAt: "2026-09-30T18:00:00",
        now,
      }),
    ).toBe(true);
  });
});
