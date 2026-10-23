import { afterEach, describe, expect, test } from "bun:test";
import { SPLASH_STORAGE_KEY, loadSplashConfig, resetSplashConfig, saveSplashConfig } from "../src/lib/splash/splash-store";
import { defaultSplashConfig } from "../src/lib/splash/splash-config";

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

describe("splash store", () => {
  test("key uses the demo namespace connexy:demo:splash-config", () => {
    expect(SPLASH_STORAGE_KEY).toBe("connexy:demo:splash-config");
  });

  test("loads defaults when nothing is persisted", () => {
    installStorage();
    expect(loadSplashConfig()).toEqual(defaultSplashConfig());
  });

  test("saves and reloads a full config", () => {
    installStorage();
    const config = {
      enabled: true,
      type: "promotional" as const,
      image: "/custom.jpg",
      title: "Conexy",
      subtitle: "Bem-vindo",
      startAt: "2026-10-01T00:00:00.000Z",
      endAt: "2026-11-01T00:00:00.000Z",
      priority: 3,
    };
    saveSplashConfig(config);
    expect(loadSplashConfig()).toEqual(config);
    expect(window.localStorage.getItem(SPLASH_STORAGE_KEY)).toBeTruthy();
  });

  test("invalid JSON falls back to defaults", () => {
    installStorage();
    window.localStorage.setItem(SPLASH_STORAGE_KEY, "{not-json");
    expect(loadSplashConfig()).toEqual(defaultSplashConfig());
  });

  test("invalid fields are dropped on load", () => {
    installStorage();
    window.localStorage.setItem(
      SPLASH_STORAGE_KEY,
      JSON.stringify({
        enabled: "yes",
        type: "unknown",
        image: "   ",
        title: "Local",
        priority: "high",
      }),
    );
    const config = loadSplashConfig();
    expect(config.enabled).toBe(true);
    expect(config.type).toBe("institutional");
    expect(config.image).toBeUndefined();
    expect(config.title).toBe("Local");
    expect(config.priority).toBeUndefined();
  });

  test("reset removes the persisted value and reloads defaults", () => {
    installStorage();
    saveSplashConfig({ enabled: false });
    expect(loadSplashConfig().enabled).toBe(false);
    resetSplashConfig();
    expect(window.localStorage.getItem(SPLASH_STORAGE_KEY)).toBeNull();
    expect(loadSplashConfig()).toEqual(defaultSplashConfig());
  });
});