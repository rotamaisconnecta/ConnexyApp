import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { formatDistance, formatHomePersonProximity, proximityLabel } from "../src/lib/proximity";
import { buildNearbyPeople } from "../src/lib/feed/home-premium";
import { setDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  listConnectPulseItems,
  listHomeDiscoveryItems,
} from "../src/lib/home/home-discovery";
import { listHappeningNowCards } from "../src/lib/home/happening-now";
import {
  comparePulseRelevance,
  matchesDayPeriod,
  rankPulseItems,
  temporalState,
  type PulseRankable,
} from "../src/lib/home/pulse-relevance";
import { ContextPeriod } from "../src/lib/context/context-types";
import { compatibilityScore, people } from "../src/lib/mock-data";

const projectRoot = join(import.meta.dir, "..");
const morning = new Date(2026, 8, 28, 8, 30, 0);
const afternoon = new Date(2026, 8, 28, 15, 30, 0);
const night = new Date(2026, 8, 28, 21, 0, 0);

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
    keys: () => [...data.keys()],
  } as MemoryStorage;
}

function installBrowser(): void {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
}

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function atHour(base: Date, hours: number, minutes = 0): number {
  const value = new Date(base);
  value.setHours(hours, minutes, 0, 0);
  return value.getTime();
}

beforeEach(() => {
  installBrowser();
  setDemoIdentity("lucas");
});

describe("Pessoas próximas — proximidade contextual", () => {
  test("até 2 km usa as categorias existentes; acima de 2 km mostra km", () => {
    expect(formatHomePersonProximity(15)).toBe(proximityLabel(15));
    expect(formatHomePersonProximity(15)).toBe("Bem pertinho");
    expect(formatHomePersonProximity(80)).toBe("Muito perto");
    expect(formatHomePersonProximity(350)).toBe("Perto");
    expect(formatHomePersonProximity(1400)).toBe("Nas redondezas");
    expect(formatHomePersonProximity(2000)).toBe("Nas redondezas");
    expect(formatHomePersonProximity(2200)).toBe(formatDistance(2200));
    expect(formatHomePersonProximity(3200)).toBe("3,2km");
    expect(formatHomePersonProximity(80)).not.toMatch(/\d+\s*m/);
    expect(formatHomePersonProximity(1400)).not.toMatch(/km/i);
  });

  test("buildNearbyPeople preserva pessoas, ordem e só muda o rótulo", () => {
    const section = buildNearbyPeople();
    const meters = section.people.map((person) => person.distanceMeters);
    expect(meters).toEqual([...meters].sort((a, b) => a - b));
    const ids = section.people.map((person) => person.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const person of section.people) {
      expect(person.distance).toBe(formatHomePersonProximity(person.distanceMeters));
      const source = people.find((item) => item.id === person.id);
      expect(source).toBeDefined();
      expect(person.compatibility).toBe(compatibilityScore(source!));
    }
    const far = section.people.find((person) => person.distanceMeters > 2000);
    expect(far?.distance).toMatch(/km/);
  });
});

describe("Connexy Pulse — relevância determinística", () => {
  test("acontecendo agora fica acima de um item só um pouco mais perto", () => {
    const happening: PulseRankable = {
      title: "Yoga",
      category: "Bem-estar",
      distanceMeters: 1500,
      startAt: atHour(morning, 7),
      endAt: atHour(morning, 9),
    };
    const nearerLater: PulseRankable = {
      title: "Show",
      category: "Música",
      distanceMeters: 400,
      startAt: atHour(morning, 20),
      endAt: atHour(morning, 23),
    };
    expect(temporalState(happening, morning)).toBe("happening");
    expect(comparePulseRelevance(happening, nearerLater, morning)).toBeLessThan(0);
  });

  test("negócio aberto agora fica acima de um fechado mais perto", () => {
    const openCafe: PulseRankable = {
      title: "Café Aroma",
      category: "CAFE",
      distanceMeters: 700,
      openNow: true,
    };
    const closedCafe: PulseRankable = {
      title: "Padaria",
      category: "CAFE",
      distanceMeters: 300,
      openNow: false,
    };
    expect(comparePulseRelevance(openCafe, closedCafe, morning)).toBeLessThan(0);
  });

  test("horário do dia prioriza café de manhã e bar à noite", () => {
    const cafe: PulseRankable = {
      title: "Café",
      category: "CAFE",
      distanceMeters: 500,
      openNow: true,
    };
    const bar: PulseRankable = {
      title: "Bar",
      category: "BAR",
      distanceMeters: 500,
      openNow: true,
    };
    expect(matchesDayPeriod(cafe, ContextPeriod.MORNING)).toBe(true);
    expect(matchesDayPeriod(bar, ContextPeriod.NIGHT)).toBe(true);
    expect(comparePulseRelevance(cafe, bar, morning)).toBeLessThan(0);
    expect(comparePulseRelevance(bar, cafe, night)).toBeLessThan(0);
  });

  test("dentro da mesma relevância o mais próximo vence", () => {
    const near: PulseRankable = { title: "Café perto", category: "CAFE", distanceMeters: 350, openNow: true };
    const far: PulseRankable = { title: "Café longe", category: "CAFE", distanceMeters: 1100, openNow: true };
    expect(rankPulseItems([far, near], morning).map((item) => item.title)).toEqual([
      "Café perto",
      "Café longe",
    ]);
  });

  test("conteúdo de amanhã no mesmo período fica acima de um evento noturno de hoje de manhã", () => {
    const tomorrowCafe: PulseRankable = {
      title: "Padaria amanhã",
      category: "CAFE",
      distanceMeters: 600,
      startAt: atHour(morning, 8) + 24 * 60 * 60 * 1000,
      endAt: atHour(morning, 10) + 24 * 60 * 60 * 1000,
    };
    const tonightShow: PulseRankable = {
      title: "Show hoje à noite",
      category: "Música",
      distanceMeters: 400,
      startAt: atHour(morning, 20),
      endAt: atHour(morning, 23),
    };
    expect(temporalState(tomorrowCafe, morning)).toBe("tomorrow");
    expect(comparePulseRelevance(tomorrowCafe, tonightShow, morning)).toBeLessThan(0);
  });

  test("catálogo local da manhã prioriza aberto/acontecendo e não reordena a lista por distância", () => {
    const all = listHomeDiscoveryItems(morning);
    expect(all.map((item) => item.distanceMeters)).toEqual(
      [...all].map((item) => item.distanceMeters).sort((a, b) => a - b),
    );
    const pulse = listConnectPulseItems(morning);
    const featured = pulse.slice(0, 5);
    expect(featured.some((item) => item.openNow || temporalState(item, morning) === "happening")).toBe(
      true,
    );
    const cafe = pulse.findIndex((item) => item.id === "place:cafe-central" || item.id === "business:b2");
    const nightShow = pulse.findIndex((item) => item.id === "event:ev3");
    expect(cafe).toBeGreaterThanOrEqual(0);
    if (nightShow >= 0) expect(cafe).toBeLessThan(nightShow);
  });

  test("à tarde e à noite a ordem muda com o horário, sem inventar itens", () => {
    const morningPulse = listConnectPulseItems(morning).map((item) => item.id);
    const afternoonPulse = listConnectPulseItems(afternoon).map((item) => item.id);
    const nightPulse = listConnectPulseItems(night).map((item) => item.id);
    expect(new Set(morningPulse).size).toBe(morningPulse.length);
    expect(afternoonPulse).not.toEqual(morningPulse);
    expect(nightPulse).not.toEqual(morningPulse);
    expect(listConnectPulseItems(night).some((item) => item.kind === "event")).toBe(true);
    expect(listConnectPulseItems(night).some((item) => item.kind === "business")).toBe(true);
    const workshop = listConnectPulseItems(afternoon).find((item) => item.id === "event:ev4");
    expect(workshop).toBeDefined();
    expect(["happening", "startingSoon"]).toContain(temporalState(workshop!, afternoon));
  });
});

describe("Acontecendo agora e descrições do Pulse", () => {
  test("usa dados vivos existentes e não o catálogo estático inventado", () => {
    const cards = listHappeningNowCards({ now: morning, posts: [], people });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some((card) => card.kind === "event" || card.kind === "business" || card.kind === "offer")).toBe(
      true,
    );
    expect(cards.every((card) => card.title.length > 0 && card.description.length > 0)).toBe(true);
    expect(cards.some((card) => card.title === "Relógio em ótimo estado")).toBe(false);
    const yoga = cards.find((card) => card.title === "Aula de Yoga ao Ar Livre");
    expect(yoga?.eyebrow).toBe("Acontecendo agora");
  });

  test("cards do Pulse separam descrição real de quando/onde", () => {
    const sunset = listHomeDiscoveryItems(morning).find((item) => item.id === "event:ev1");
    expect(sunset?.title).toBe("Sunset no Parque");
    expect(sunset?.summary).toBeUndefined();
    expect(sunset?.whenLabel).toBe("Hoje · 17:00");
    expect(sunset?.whereLabel).toBe("Parque Central");
    const cafe = listHomeDiscoveryItems(morning).find((item) => item.id === "place:cafe-central");
    expect(cafe?.summary).toContain("Cafeteria com grãos especiais");
    expect(cafe?.whenLabel).toBe("Aberto até 23:00");
    const offer = listHomeDiscoveryItems(morning).find((item) => item.kind === "offer");
    expect(offer?.summary).toBeTruthy();
    expect(offer?.whenLabel).toBe("Disponível agora");
  });
});

describe("Home — nomenclatura, BottomNav e Conversas", () => {
  test("Descobertas locais passa a Destaques da região sem criar seção nova", async () => {
    const sponsored = await source("src/components/ads/LocalSponsoredFeed.tsx");
    expect(sponsored).toContain("Destaques da região");
    expect(sponsored).not.toContain("Descobertas locais");
    expect(sponsored).not.toContain("Descoberta de locais");
    const home = await source("src/routes/_app.home.tsx");
    expect(home).toContain("LocalSponsoredFeed");
    expect(home).toContain("ConnexyPulse");
    expect(home).toContain("HomeActionHub");
    expect(home).toContain("FeedNearbyPeople");
  });

  test("BottomNav mantém Conversas sempre visível e Pessoas próximas em 146px", async () => {
    const nav = await source("src/components/bottom-nav.tsx");
    expect(nav).toContain('label: "Conversas"');
    expect(nav).toContain('route: "/chat"');
    expect(nav).not.toContain("driver");
    expect(nav).not.toContain("isDriver");
    const peopleFeed = await source("src/components/feed/FeedNearbyPeople.tsx");
    expect(peopleFeed).toContain("w-[146px]");
    expect(peopleFeed).toContain("Compatibilidade");
    const hub = await source("src/components/home/HomeActionHub.tsx");
    expect(hub).toContain("listHappeningNowCards");
    expect(hub).not.toContain("Relógio em ótimo estado");
    expect(hub).not.toContain("Um novo espaço abriu perto de você");
  });
});
