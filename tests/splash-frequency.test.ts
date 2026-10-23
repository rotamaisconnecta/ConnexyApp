import { afterEach, describe, expect, test } from "bun:test";
import {
  MAX_SPLASH_PER_DAY,
  SPLASH_CAMPAIGN_ID,
  SPLASH_USAGE_PREFIX,
  canShowSplash,
  getSplashUsageKey,
  registerSplashImpression,
  splashDailyCount,
} from "../src/lib/splash/splash-frequency";
import { registerImpression as registerPopupImpression } from "../src/components/promo-popup";

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

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
});

// 10h da manhã no horário de Brasília = 13:00 UTC.
const MORNING_BRT = new Date("2026-10-08T13:00:00.000Z");

describe("splash frequency", () => {
  test("uses its own stable campaign id and key namespace", () => {
    expect(SPLASH_CAMPAIGN_ID).toBe("splash-campaign-v1");
    expect(SPLASH_USAGE_PREFIX).toBe("connexy:splash-usage");
    expect(getSplashUsageKey("user-1")).toBe("connexy:splash-usage:user-1:splash-campaign-v1");
    // Identidade anônima preserva o formato usado nas demais campanhas.
    expect(getSplashUsageKey(null)).toBe("connexy:splash-usage:anon:splash-campaign-v1");
  });

  test("allows the first display of the day", () => {
    installStorage();
    expect(canShowSplash("user-1", MORNING_BRT)).toBe(true);
  });

  test("registers an impression only once per period", () => {
    installStorage();
    expect(registerSplashImpression("user-1", MORNING_BRT)).toBe(true);
    expect(registerSplashImpression("user-1", MORNING_BRT)).toBe(false);
    expect(splashDailyCount("user-1", MORNING_BRT)).toBe(1);
    expect(canShowSplash("user-1", MORNING_BRT)).toBe(false);
  });

  test("blocks after the daily limit of three periods", () => {
    installStorage();
    // 2026-10-08 em Brasília: manhã (13:00Z), tarde (20:00Z) e noite (00:30Z de 10-09).
    expect(registerSplashImpression("user-1", new Date("2026-10-08T13:00:00.000Z"))).toBe(true);
    expect(registerSplashImpression("user-1", new Date("2026-10-08T20:00:00.000Z"))).toBe(true);
    expect(registerSplashImpression("user-1", new Date("2026-10-09T00:30:00.000Z"))).toBe(true);
    const nightLocal = new Date("2026-10-09T00:30:00.000Z");
    expect(splashDailyCount("user-1", nightLocal)).toBe(MAX_SPLASH_PER_DAY);
    expect(canShowSplash("user-1", nightLocal)).toBe(false);
    expect(canShowSplash("user-2", nightLocal)).toBe(true);
  });

  test("resets at midnight Brasília (day rollover)", () => {
    installStorage();
    const beforeMidnight = new Date("2026-10-08T02:59:00.000Z"); // 10-07 à noite
    const afterMidnight = new Date("2026-10-08T03:00:00.000Z"); // 10-08, sem período
    expect(registerSplashImpression("user-1", beforeMidnight)).toBe(true);
    expect(splashDailyCount("user-1", beforeMidnight)).toBe(1);
    expect(canShowSplash("user-1", afterMidnight)).toBe(false); // fora de período: não exibe
    expect(splashDailyCount("user-1", afterMidnight)).toBe(0); // contagem do dia novo
    const newMorning = new Date("2026-10-08T13:00:00.000Z"); // 10-08 manhã
    expect(canShowSplash("user-1", newMorning)).toBe(true);
  });

  test("splash keeps a separate counter from the promo popup", () => {
    installStorage();
    registerSplashImpression("user-1", MORNING_BRT);
    registerPopupImpression("user-1", "2026-10-08", "morning");
    expect(splashDailyCount("user-1", MORNING_BRT)).toBe(1);
    // O popup continua usando sua própria chave, sem alteração.
    expect(window.localStorage.getItem("connexy:promotion-usage:user-1:cafe-central-20off")).toBeTruthy();
  });

  test("dobra a contagem apenas quando a splash foi de fato exibida", () => {
    installStorage();
    const first = canShowSplash("user-1", MORNING_BRT);
    if (first) registerSplashImpression("user-1", MORNING_BRT);
    expect(splashDailyCount("user-1", MORNING_BRT)).toBe(1);
    expect(registerSplashImpression("user-1", MORNING_BRT)).toBe(false);
    expect(splashDailyCount("user-1", MORNING_BRT)).toBe(1);
  });
});