import { describe, expect, test } from "bun:test";
import {
  defaultSplashConfig,
  getSafeSplashConfig,
  isSplashActiveNow,
  sanitizeSplashConfig,
} from "../src/lib/splash/splash-config";

describe("splash config", () => {
  test("has safe defaults", () => {
    const cfg = getSafeSplashConfig();
    expect(cfg.enabled).toBe(true);
  });

  test("schedule validation returns safe config", () => {
    const cfg = getSafeSplashConfig();
    expect(isSplashActiveNow(cfg)).toBe(true);
    expect(isSplashActiveNow({ enabled: false })).toBe(false);
    expect(isSplashActiveNow({ enabled: true, startAt: "invalid" })).toBe(true);
    expect(isSplashActiveNow({ enabled: true, endAt: "invalid" })).toBe(true);
  });

  test("sanitize returns defaults for garbage input", () => {
    expect(sanitizeSplashConfig(null)).toEqual(defaultSplashConfig());
    expect(sanitizeSplashConfig(undefined)).toEqual(defaultSplashConfig());
    expect(sanitizeSplashConfig("nope")).toEqual(defaultSplashConfig());
    expect(sanitizeSplashConfig(42)).toEqual(defaultSplashConfig());
  });

  test("sanitize keeps valid fields and trims text", () => {
    const cfg = sanitizeSplashConfig({
      enabled: true,
      type: "sponsored",
      image: "  /promo.jpg  ",
      title: "  Nova oferta  ",
      subtitle: "Neste mês",
      startAt: "2026-10-01T00:00:00.000Z",
      endAt: "2026-11-01T00:00:00.000Z",
      priority: 2,
    });
    expect(cfg).toEqual({
      enabled: true,
      type: "sponsored",
      image: "/promo.jpg",
      title: "Nova oferta",
      subtitle: "Neste mês",
      startAt: "2026-10-01T00:00:00.000Z",
      endAt: "2026-11-01T00:00:00.000Z",
      priority: 2,
    });
  });

  test("sanitize drops invalid or empty fields", () => {
    const cfg = sanitizeSplashConfig({
      enabled: "yes",
      type: "mystery",
      image: "   ",
      startAt: "not-a-date",
      endAt: "2026-11-01T00:00:00.000Z",
      priority: Number.POSITIVE_INFINITY,
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.type).toBe("institutional");
    expect(cfg.image).toBeUndefined();
    expect(cfg.startAt).toBeUndefined();
    expect(cfg.endAt).toBe("2026-11-01T00:00:00.000Z");
    expect(cfg.priority).toBeUndefined();
  });
});
