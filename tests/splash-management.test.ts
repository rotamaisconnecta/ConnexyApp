import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { UserRole } from "../src/lib/roles/roles-types";
import { canManageCampaigns } from "../src/lib/roles/roles-guards";
import { canManageSplash } from "../src/lib/splash/splash-permissions";

const projectRoot = join(import.meta.dir, "..");

describe("splash management", () => {
  test("splash permission derives from canManageCampaigns", () => {
    expect(canManageSplash([])).toBe(canManageCampaigns([]));
    expect(canManageSplash([UserRole.USER])).toBe(canManageCampaigns([UserRole.USER]));
    expect(canManageSplash([UserRole.BUSINESS])).toBe(canManageCampaigns([UserRole.BUSINESS]));
  });

  test("business role can manage splash; plain user cannot", () => {
    expect(canManageSplash([UserRole.BUSINESS])).toBe(true);
    expect(canManageSplash([UserRole.USER])).toBe(false);
    expect(canManageSplash([])).toBe(false);
  });

  test("SPLASH permission never grants campaign rights artificially", () => {
    expect(canManageSplash([UserRole.DRIVER])).toBe(false);
    expect(canManageSplash([UserRole.EVENT_CREATOR])).toBe(false);
    expect(canManageSplash([UserRole.PLACE_OWNER])).toBe(false);
    expect(canManageSplash([UserRole.REELS_CREATOR])).toBe(false);
  });

  test("Gerenciar layout exposes the splash entry only via canManageSplash", async () => {
    const gerenciar = await readFile(join(projectRoot, "src/routes/_app.gerenciar.tsx"), "utf8");
    expect(gerenciar).toContain("canManageSplash");
    expect(gerenciar).toContain('to="/gerenciar/splash"');
    expect(gerenciar).toContain("Splash screen");
  });

  test("management screen lives inside Gerenciar and reuses local store + guards", async () => {
    const screen = await readFile(join(projectRoot, "src/routes/_app.gerenciar.splash.tsx"), "utf8");
    expect(screen).toContain("createFileRoute(\"/_app/gerenciar/splash\")");
    expect(screen).toContain("canManageSplash");
    expect(screen).toContain("saveSplashConfig");
    expect(screen).toContain("loadSplashConfig");
    expect(screen).toContain("resetSplashConfig");
  });

  test("SplashScreen consumes the local config, gates by frequency and renders texts", async () => {
    const screen = await readFile(join(projectRoot, "src/components/splash/SplashScreen.tsx"), "utf8");
    expect(screen).toContain("loadSplashConfig");
    expect(screen).toContain("isSplashActiveNow");
    expect(screen).toContain("canShowSplash");
    expect(screen).toContain("registerSplashImpression");
    expect(screen).toContain("cfg.title");
    expect(screen).toContain("cfg.subtitle");
  });
});