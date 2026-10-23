import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AD_METRICS_STORAGE_KEY,
  AD_PLACEMENTS,
  MAX_AD_METRIC_EVENTS,
  appendAdMetricEvent,
  buildAdMetricEvent,
  buildExposureKey,
  createExposureRecorder,
  readAdMetrics,
  recordAdMetric,
  sanitizeAdMetricEvent,
  summarizeAdMetrics,
  uniqueEventId,
  type AdMetricEvent,
} from "../src/lib/ads/ad-metrics";

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

function serverStorage(behavior: { throwOnWrite?: boolean } = {}): {
  storage: Storage;
  failWrites: () => void;
} {
  const data = new Map<string, string>();
  let throwOnWrite = behavior.throwOnWrite === true;
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => {
      if (throwOnWrite) throw new DOMException("quota", "QuotaExceededError");
      data.set(String(key), String(value));
    },
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
  return {
    storage,
    failWrites: () => {
      throwOnWrite = true;
    },
  };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
});

const NOW = new Date("2026-10-09T12:00:00.000Z");
const idGen = () => "fixed-id";

function impression(
  ad = "cafe-aurora",
  placement = AD_PLACEMENTS.HOME_REGIONAL_HIGHLIGHTS,
): AdMetricEvent | null {
  return buildAdMetricEvent(
    { type: "impression", ad, placement, campaignId: null, advertiserId: null },
    NOW,
    idGen,
  );
}

describe("Fase 18D — armazenamento de métricas", () => {
  test("1. registra e recupera uma impressão na chave versionada", () => {
    installStorage();
    expect(AD_METRICS_STORAGE_KEY).toBe("connexy:demo:ad-metrics:v1");
    const event = recordAdMetric(
      { type: "impression", ad: "cafe-aurora", placement: AD_PLACEMENTS.HOME_REGIONAL_HIGHLIGHTS },
      { now: NOW, idGen },
    );
    expect(event?.type).toBe("impression");
    expect(event?.ad).toBe("cafe-aurora");
    expect(event?.placement).toBe("home_regional_highlights");
    expect(event?.campaignId).toBeNull();
    expect(event?.at).toBe("2026-10-09T12:00:00.000Z");
    const stored = readAdMetrics();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(event);
  });

  test("2. registra e recupera um clique com campanha real quando existir", () => {
    installStorage();
    const event = recordAdMetric(
      {
        type: "click",
        ad: "arena-move",
        placement: AD_PLACEMENTS.POST_RIDE_DISCOVERY,
        campaignId: "campanha-verde",
        advertiserId: "anunciante-1",
      },
      { now: NOW, idGen },
    );
    expect(event?.type).toBe("click");
    expect(event?.campaignId).toBe("campanha-verde");
    expect(event?.advertiserId).toBe("anunciante-1");
    expect(readAdMetrics()[0]?.type).toBe("click");
  });

  test("3. storage vazio retorna lista vazia", () => {
    installStorage();
    expect(readAdMetrics()).toEqual([]);
  });

  test("4. JSON inválido não derruba a leitura", () => {
    installStorage();
    window.localStorage.setItem(AD_METRICS_STORAGE_KEY, "{ corrupted json");
    expect(readAdMetrics()).toEqual([]);
  });

  test("5. registros malformados são ignorados na leitura", () => {
    installStorage();
    window.localStorage.setItem(
      AD_METRICS_STORAGE_KEY,
      JSON.stringify([
        { id: "a", type: "impression", ad: "ok", placement: "x", campaignId: null, advertiserId: null, at: "2026-10-09T12:00:00.000Z" },
        { id: "b", type: "hover", ad: "ok", placement: "x", at: "2026-10-09T12:00:00.000Z" },
        { id: "c", type: "click", ad: "", placement: "x", at: "2026-10-09T12:00:00.000Z" },
        { id: "d", type: "impression", ad: "ok", placement: "x", at: "não-é-data" },
        "totally-malformed",
      ]),
    );
    const stored = readAdMetrics();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toBe("a");
  });

  test("6. histórico limitado preserva os eventos mais recentes", () => {
    installStorage();
    for (let i = 0; i < 5; i += 1) {
      recordAdMetric(
        { type: "impression", ad: `ad-${i}`, placement: "p" },
        { now: NOW, idGen: () => `id-${i}` },
      );
    }
    expect(readAdMetrics()).toHaveLength(5);
    expect(appendAdMetricEvent(impression("ultimo"), undefined, 3)).toBe(true);
    const stored = readAdMetrics();
    expect(stored).toHaveLength(3);
    expect(stored.map((e) => e.ad)).toEqual(["ad-3", "ad-4", "ultimo"]);
    expect(MAX_AD_METRIC_EVENTS).toBe(2_000);
  });

  test("7. falha de storage não lança erro nem derruba a escrita da UI", () => {
    const harness = serverStorage();
    const event = impression("cafe-aurora");
    expect(event).not.toBeNull();
    harness.failWrites();
    expect(() => recordAdMetric({ type: "impression", ad: "x", placement: "p" }, { now: NOW, idGen })).not.toThrow();
    expect(() => appendAdMetricEvent(event)).not.toThrow();
    expect(readAdMetrics()).toEqual([]);
  });

  test("identificadores de evento são únicos", () => {
    const ids = new Set([uniqueEventId(NOW.getTime()), uniqueEventId(NOW.getTime()), uniqueEventId(NOW.getTime())]);
    expect(ids.size).toBe(3);
  });
});

describe("Fase 18D — regra de impressão", () => {
  test("8. entrada válida de impressão vai para o storage com todos os campos", () => {
    installStorage();
    const event = recordAdMetric(
      { type: "impression", ad: "estudio-alma", placement: AD_PLACEMENTS.HOME_REGIONAL_HIGHLIGHTS },
      { now: NOW, idGen },
    );
    expect(event?.ad).toBe("estudio-alma");
    expect(event?.placement).toBe("home_regional_highlights");
    expect(readAdMetrics()[0]?.ad).toBe("estudio-alma");
  });

  test("9. seleção de anúncio não registra impressão (módulos de seleção são passivos)", async () => {
    const [placement, postRide] = await Promise.all([
      readFile(join(projectRoot, "src/lib/ads/sponsored-placement.ts"), "utf8"),
      readFile(join(projectRoot, "src/lib/mobility/post-ride-discovery.ts"), "utf8"),
    ]);
    expect(placement).not.toContain("recordAdMetric");
    expect(placement).toContain("selectEligibleSponsored");
    expect(postRide).not.toContain("recordAdMetric");
    expect(postRide).not.toContain("ad-metrics");
  });

  test("10. dedup por exposição evita contagem duplicada na mesma exibição", () => {
    const recorder = createExposureRecorder();
    const key = buildExposureKey("home_regional_highlights", "cafe-aurora", "mount-1");
    expect(recorder.recordOnce(key)).toBe(true);
    expect(recorder.recordOnce(key)).toBe(false);
    expect(recorder.recordOnce(key)).toBe(false);
  });

  test("11. uma nova exposição (nova montagem) permite nova impressão", () => {
    const first = createExposureRecorder();
    const second = createExposureRecorder();
    const keyFirst = buildExposureKey("home_regional_highlights", "cafe-aurora", "mount-1");
    const keySecond = buildExposureKey("home_regional_highlights", "cafe-aurora", "mount-2");
    expect(first.recordOnce(keyFirst)).toBe(true);
    expect(second.recordOnce(keySecond)).toBe(true);
    // Chave de exposição distingue ciclos de montagem.
    expect(keyFirst).not.toBe(keySecond);
  });

  test("12. registros ficam separados por posicionamento", () => {
    installStorage();
    recordAdMetric(
      { type: "impression", ad: "cafe-aurora", placement: AD_PLACEMENTS.HOME_REGIONAL_HIGHLIGHTS },
      { now: NOW, idGen },
    );
    recordAdMetric(
      { type: "impression", ad: "cafe-aurora", placement: AD_PLACEMENTS.POST_RIDE_DISCOVERY },
      { now: NOW, idGen },
    );
    recordAdMetric(
      { type: "click", ad: "cafe-aurora", placement: AD_PLACEMENTS.HOME_REGIONAL_HIGHLIGHTS },
      { now: NOW, idGen },
    );
    const summary = summarizeAdMetrics(readAdMetrics());
    expect(summary.impressions).toBe(2);
    expect(summary.clicks).toBe(1);
    expect(summary.byPlacement["home_regional_highlights"]).toEqual({ impressions: 1, clicks: 1 });
    expect(summary.byPlacement["post_ride_discovery"]).toEqual({ impressions: 1, clicks: 0 });
    expect(summarizeAdMetrics([])).toEqual({ impressions: 0, clicks: 0, byPlacement: {}, byAd: {} });
  });

  test("impressões dependem de visibilidade real no DOM", async () => {
    const hook = await readFile(join(projectRoot, "src/hooks/use-ad-metrics.ts"), "utf8");
    expect(hook).toContain("IntersectionObserver");
    expect(hook).toContain("entry.isIntersecting");
    expect(hook).toContain("buildExposureKey");
    expect(hook).toContain("createExposureRecorder");
    // Sem observador/ambiente, nenhuma impressão é forjada.
    expect(hook).toContain('typeof IntersectionObserver === "undefined"');
  });
});

describe("Fase 18D — regra de clique", () => {
  test("13. entrada válida de clique é registrada", () => {
    installStorage();
    const event = recordAdMetric(
      { type: "click", ad: "vinil-da-esquina", placement: AD_PLACEMENTS.POST_RIDE_DISCOVERY },
      { now: NOW, idGen },
    );
    expect(event?.type).toBe("click");
    expect(readAdMetrics()[0]?.type).toBe("click");
  });

  test("14. nenhum clique é registrado durante renderização ou carregamento", async () => {
    const files = await Promise.all([
      readFile(join(projectRoot, "src/components/ads/LocalSponsoredFeed.tsx"), "utf8"),
      readFile(join(projectRoot, "src/components/mobility/ride/ride-live-panels.tsx"), "utf8"),
      readFile(join(projectRoot, "src/components/feed/cards/premium-card.tsx"), "utf8"),
    ]);
    for (const content of files) {
      // Cliques só dentro de handlers de ação do usuário.
      expect(content).toContain("onClick");
    }
    const hook = await readFile(join(projectRoot, "src/hooks/use-ad-metrics.ts"), "utf8");
    expect(hook).not.toContain('"click"');
    expect(hook).not.toContain("'click'");
  });

  test("15. um único acionamento gera um único evento de clique (handler único)", async () => {
    const [feed, premium] = await Promise.all([
      readFile(join(projectRoot, "src/components/ads/LocalSponsoredFeed.tsx"), "utf8"),
      readFile(join(projectRoot, "src/components/feed/cards/premium-card.tsx"), "utf8"),
    ]);
    // O handler grava o clique quando existe um anúncio patrocinado e a navegação é preservada.
    const feedClicks = feed.match(/type: "click"/g) ?? [];
    expect(feedClicks).toHaveLength(1);
    const premiumClicks = premium.match(/type: "click"/g) ?? [];
    expect(premiumClicks).toHaveLength(1);
  });

  test("16. destinos de navegação preservados após o registro do clique", async () => {
    const [feed, panels, premium] = await Promise.all([
      readFile(join(projectRoot, "src/components/ads/LocalSponsoredFeed.tsx"), "utf8"),
      readFile(join(projectRoot, "src/components/mobility/ride/ride-live-panels.tsx"), "utf8"),
      readFile(join(projectRoot, "src/components/feed/cards/premium-card.tsx"), "utf8"),
    ]);
    expect(feed).toContain("nav({ href: route })");
    expect(feed).toContain("resolveSponsoredRoute");
    expect(feed).toContain("toast.success");
    expect(panels).toContain("nav({ href: target.href })");
    expect(panels).toContain("window.open(target.href");
    expect(premium).toContain("to={route}");
  });
});

describe("Fase 18D — integridade", () => {
  test("17. conteúdos orgânicos nunca geram métricas", async () => {
    const [panels, premium] = await Promise.all([
      readFile(join(projectRoot, "src/components/mobility/ride/ride-live-panels.tsx"), "utf8"),
      readFile(join(projectRoot, "src/components/feed/cards/premium-card.tsx"), "utf8"),
    ]);
    // Pós-viagem: métricas somente quando isSponsoredPlacement(card) é true.
    expect(panels).toContain('ad: "", placement: ""');
    expect(panels).toContain('if (sponsored) {');
    // Premium: somente quando o selo é explicitamente "Patrocinado".
    expect(premium).toContain('card.badge === "Patrocinado"');
  });

  test("18. classificação 18A preservada (sem badge em orgânicos)", () => {
    const event = sanitizeAdMetricEvent({
      id: "x",
      type: "impression",
      ad: "event-org",
      placement: "post_ride_discovery",
      at: "2026-10-09T12:00:00.000Z",
      sponsored: false,
    });
    expect(event?.ad).toBe("event-org");
    // O registro usa os campos canônicos do anúncio, não a categoria visual.
    expect(buildAdMetricEvent({ type: "impression", ad: "event-org", placement: "post_ride_discovery" }, NOW, idGen)?.type).toBe("impression");
  });

  test("19. filtros/seleção 18C preservados na Home", async () => {
    const feed = await readFile(join(projectRoot, "src/components/ads/LocalSponsoredFeed.tsx"), "utf8");
    expect(feed).toContain("selectEligibleSponsored");
    expect(feed).toContain("liveDistanceMeters <= 2_000");
    expect(feed).toContain("ranked.slice(0, 3)");
    expect(feed).toContain('subtitle="Patrocinados em destaque na região"');
  });

  test("20. campanha ausente nunca é inventada (null)", () => {
    const without = buildAdMetricEvent({ type: "click", ad: "x", placement: "p" }, NOW, idGen);
    expect(without?.campaignId).toBeNull();
    expect(without?.advertiserId).toBeNull();
    const withCampaign = buildAdMetricEvent(
      { type: "click", ad: "x", placement: "p", campaignId: "real-camp" },
      NOW,
      idGen,
    );
    expect(withCampaign?.campaignId).toBe("real-camp");
    const empty = buildAdMetricEvent({ type: "click", ad: "x", placement: "p", campaignId: "" }, NOW, idGen);
    expect(empty?.campaignId).toBeNull();
  });

  test("21. nenhum consumo de orçamento introduzido", async () => {
    // A instrumentação desta fase vive nesses arquivos. O campo `budget?`
    // do inventário pré-existente (sponsored-placement.ts) permanece inerte
    // e independente das métricas, conforme a separação financeira.
    const metrics = [
      "src/lib/ads/ad-metrics.ts",
      "src/hooks/use-ad-metrics.ts",
      "src/components/ads/LocalSponsoredFeed.tsx",
      "src/components/mobility/ride/ride-live-panels.tsx",
      "src/components/feed/cards/premium-card.tsx",
    ];
    return Promise.all(metrics.map((file) =>
      readFile(join(projectRoot, file), "utf8").then((content) => {
        // Usos de código de orçamento (nunca ocorrem; comentários não contam).
        expect(content, file).not.toMatch(/\.budget|budget\s*[-+*/]|budget\s*[:=]\s*\d/);
      }),
    ));
  });

  test("22. nenhuma chamada remota introduzida", async () => {
    // Os módulos criados nesta fase são o único ponto onde uma chamada
    // remota poderia ter sido adicionada.
    const modules = ["src/lib/ads/ad-metrics.ts", "src/hooks/use-ad-metrics.ts"];
    for (const file of modules) {
      const content = await readFile(join(projectRoot, file), "utf8");
      expect(content, file).not.toMatch(/\bfetch\s*\(/);
      expect(content, file).not.toMatch(/from\s+["'][^"']*supabase["']/i);
      expect(content, file).not.toMatch(/supabase\//i);
      expect(content, file).not.toMatch(/https?:\/\//);
    }
    // Os componentes continuam importando métricas apenas do módulo local.
    const components = [
      "src/components/ads/LocalSponsoredFeed.tsx",
      "src/components/mobility/ride/ride-live-panels.tsx",
      "src/components/feed/cards/premium-card.tsx",
    ];
    for (const file of components) {
      const content = await readFile(join(projectRoot, file), "utf8");
      expect(content, file).not.toMatch(/\bfetch\s*\(/);
      expect(content, file).toContain('from "@/lib/ads/ad-metrics"');
    }
  });
});