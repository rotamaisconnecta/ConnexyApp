import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  brasiliaDateAndPeriod,
  readUsage,
  registerImpression,
} from "../src/components/promo-popup";
import { SPONSORED_ADS } from "../src/lib/ads/mock-sponsored-content";
import {
  isSponsoredPlacement,
  interleavePlacements,
  type OrganicPlacement,
  type SponsoredPlacement,
} from "../src/lib/ads/sponsored-placement";

const projectRoot = join(import.meta.dir, "..");

function installStorage(): void {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
  } as Storage;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { localStorage: storage },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
}

function organic(id: string): OrganicPlacement {
  return {
    id,
    name: id,
    image: "/local.jpg",
    category: "Local",
    distanceMeters: 100,
    targetType: "place",
    targetId: id,
    sponsored: false,
  };
}

function sponsored(id: string): SponsoredPlacement {
  return {
    id,
    name: id,
    image: "/ad.jpg",
    category: "Local",
    distanceMeters: 100,
    targetType: "business",
    targetId: id,
    sponsored: true,
  };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("Fase 15 — frequência promocional e identificação patrocinada", () => {
  test("permite até três impressões em períodos distintos e bloqueia repetição", () => {
    installStorage();
    const date = "2026-10-08";

    expect(registerImpression(null, date, "morning")).toBe(true);
    expect(registerImpression(null, date, "morning")).toBe(false);
    expect(registerImpression(null, date, "afternoon")).toBe(true);
    expect(registerImpression(null, date, "night")).toBe(true);
    expect(readUsage(null, date).shownPeriods).toHaveLength(3);
  });

  test("o período muda de dia à meia-noite de São Paulo e reinicia a contagem", () => {
    installStorage();
    const beforeMidnight = brasiliaDateAndPeriod(new Date("2026-10-08T02:59:00.000Z"));
    const afterMidnight = brasiliaDateAndPeriod(new Date("2026-10-08T03:00:00.000Z"));

    expect(beforeMidnight).toEqual({ date: "2026-10-07", period: "night" });
    expect(afterMidnight).toEqual({ date: "2026-10-08", period: null });
    expect(registerImpression(null, beforeMidnight.date, "morning")).toBe(true);
    expect(readUsage(null, afterMidnight.date).shownPeriods).toEqual([]);

    const nextMorning = brasiliaDateAndPeriod(new Date("2026-10-08T13:00:00.000Z"));
    expect(nextMorning).toEqual({ date: "2026-10-08", period: "morning" });
    expect(registerImpression(null, nextMorning.date, "morning")).toBe(true);
  });

  test("patrocinados mantêm o marcador e convivem com resultados orgânicos", async () => {
    const ads = SPONSORED_ADS.slice(0, 2).map((ad) => ({
      id: ad.id,
      advertiserId: ad.id,
      name: ad.title,
      image: ad.cover ?? "",
      category: ad.category,
      distanceMeters: ad.distanceMeters,
      targetType: "business" as const,
      targetId: ad.id,
      sponsored: true as const,
    }));
    const placements = interleavePlacements([organic("place-a"), organic("place-b")], ads);

    expect(placements.filter(isSponsoredPlacement)).toHaveLength(2);
    expect(placements.filter((placement) => !isSponsoredPlacement(placement))).toHaveLength(2);
    const feed = await readFile(join(projectRoot, "src/components/ads/LocalSponsoredFeed.tsx"), "utf8");
    expect(feed).toContain("SPONSORED_ADS");
    expect(feed).toContain("Patrocinado");
    expect(feed).toContain("Patrocinados em destaque na região");
    expect(feed).not.toContain("Patrocinados em até 2 km");
  });
});
