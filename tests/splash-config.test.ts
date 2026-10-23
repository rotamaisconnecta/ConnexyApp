import { describe, expect, test } from "bun:test";
import { getSafeSplashConfig, isSplashActiveNow } from "../src/lib/splash/splash-config";

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
});
