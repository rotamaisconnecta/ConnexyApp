import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { hasGlobalAdminClaim } from "../src/lib/admin/admin-access";
import { buildAdminAdOverview, getAdCtrPercent } from "../src/lib/admin/admin-overview";
import { UserRole } from "../src/lib/roles/roles-types";
import { canManageSplash } from "../src/lib/splash/splash-permissions";
import { grantPlatformAdmin, revokePlatformAdmin } from "../src/lib/admin/admin-provisioning";

describe("Fase 19 — fundação do centro de comando", () => {
  test("somente claim administrativo explicitamente assinado autoriza a camada real", () => {
    expect(hasGlobalAdminClaim({ app_metadata: { platform_role: "admin" } })).toBe(true);
    expect(hasGlobalAdminClaim({ app_metadata: { platform_role: "business" } })).toBe(false);
    expect(hasGlobalAdminClaim({ app_metadata: { role: "admin" } })).toBe(false);
    expect(hasGlobalAdminClaim({ user_metadata: { platform_role: "admin" } })).toBe(false);
    expect(hasGlobalAdminClaim({ app_metadata: { platform_role: "admin " } })).toBe(false);
    expect(hasGlobalAdminClaim({ app_metadata: "admin" })).toBe(false);
    expect(hasGlobalAdminClaim(null)).toBe(false);
  });

  test("provisionamento confiável adiciona/remove só o claim e preserva metadados alheios", () => {
    const existing = { provider: "email", support_tier: "standard" };
    const granted = grantPlatformAdmin(existing);
    expect(granted).toEqual({ ...existing, platform_role: "admin" });
    expect(hasGlobalAdminClaim({ app_metadata: granted })).toBe(true);
    const revoked = revokePlatformAdmin(granted);
    expect(revoked).toEqual(existing);
    expect(hasGlobalAdminClaim({ app_metadata: revoked })).toBe(false);
  });

  test("papéis de usuário, negócio, motorista e organizador não concedem admin global", () => {
    for (const role of [UserRole.USER, UserRole.BUSINESS, UserRole.DRIVER, UserRole.EVENT_CREATOR]) {
      expect(hasGlobalAdminClaim({ app_metadata: { platform_role: role } })).toBe(false);
    }
    expect(canManageSplash([UserRole.BUSINESS])).toBe(true);
    expect(canManageSplash([UserRole.USER])).toBe(false);
  });

  test("CTR usa cliques/impressões e permanece zero sem impressões", () => {
    expect(getAdCtrPercent(40, 3)).toBe(7.5);
    expect(getAdCtrPercent(0, 3)).toBe(0);
    expect(getAdCtrPercent(-1, 3)).toBe(0);
  });

  test("métricas usam o resumo público e exibem os três posicionamentos existentes", () => {
    const overview = buildAdminAdOverview([
      { id: "1", type: "impression", ad: "ad-a", placement: "home_regional_highlights", campaignId: null, advertiserId: null, at: "2026-10-09T12:00:00.000Z" },
      { id: "2", type: "click", ad: "ad-a", placement: "home_regional_highlights", campaignId: null, advertiserId: null, at: "2026-10-09T12:01:00.000Z" },
      { id: "3", type: "impression", ad: "ad-b", placement: "post_ride_discovery", campaignId: null, advertiserId: null, at: "2026-10-09T12:02:00.000Z" },
    ]);
    expect(overview.impressions).toBe(2);
    expect(overview.clicks).toBe(1);
    expect(overview.ctrPercent).toBe(50);
    expect(overview.period).toEqual({ from: "2026-10-09T12:00:00.000Z", to: "2026-10-09T12:02:00.000Z" });
    expect(overview.placements.map((item) => item.id)).toEqual([
      "home_regional_highlights",
      "post_ride_discovery",
      "home_premium",
    ]);
    expect(overview.placements[2]).toMatchObject({ impressions: 0, clicks: 0 });
  });

  test("admin é rota raiz separada e exige a checagem do servidor; não usa os papéis comerciais", async () => {
    const route = await Bun.file(new URL("../src/routes/admin.tsx", import.meta.url)).text();
    const access = await Bun.file(new URL("../src/lib/admin/admin-access.ts", import.meta.url)).text();
    expect(route).toContain('createFileRoute("/admin")');
    expect(route).toContain("getPlatformAdminAccess");
    expect(route).toContain("if (!access.authorized) throw redirect");
    expect(access).toContain('platform_role === "admin"');
    expect(access).toContain("supabase.auth.getUser()");
    expect(access).not.toContain("supabase.auth.getClaims()");
    expect(access).toContain('mode: "denied"');
    expect(access).toContain("catch {");
    expect(access).toContain("isDemoMode()");
    expect(access).not.toContain("getStoredRoles");
    expect(access).not.toContain("UserRole.BUSINESS");
  });

  test("dashboard reutiliza métricas e splash local sem substituir seus armazenamentos", async () => {
    const route = await Bun.file(new URL("../src/routes/admin.tsx", import.meta.url)).text();
    const splash = await Bun.file(new URL("../src/routes/_app.gerenciar.splash.tsx", import.meta.url)).text();
    expect(route).toContain("readAdMetrics");
    expect(route).toContain("buildAdminAdOverview");
    expect(route).toContain("loadSplashConfig");
    expect(route).toContain("setStorageError(true)");
    expect(route).toContain("/gerenciar/splash");
    expect(splash).toContain("getPlatformAdminAccess");
    expect(splash).toContain("isGlobalAdmin || canManageSplash(rolesState.roles)");
    expect(splash).toContain("if (!(await hasCurrentSplashPermission()))");
    expect(splash.match(/if \(!\(await hasCurrentSplashPermission\(\)\)\)/g)).toHaveLength(2);
  });

  test("não foram adicionados acessos remotos ou migrações à fundação", async () => {
    const route = await Bun.file(new URL("../src/routes/admin.tsx", import.meta.url)).text();
    const access = await Bun.file(new URL("../src/lib/admin/admin-access.ts", import.meta.url)).text();
    expect(route).not.toContain("fetch(");
    expect(access).not.toContain("service_role");
    expect(access).not.toContain("supabase.from(");
  });

  test("provisionamento fica em script confiável, com confirmação e sem credencial no código cliente", async () => {
    const script = await Bun.file(new URL("../scripts/admin-access.ts", import.meta.url)).text();
    const route = await Bun.file(new URL("../src/routes/admin.tsx", import.meta.url)).text();
    const access = await Bun.file(new URL("../src/lib/admin/admin-access.ts", import.meta.url)).text();
    expect(script).toContain("APP_SUPABASE_SERVICE_ROLE_KEY");
    expect(script).toContain("auth.admin.updateUserById");
    expect(script).toContain("auth.admin.getUserById");
    expect(script).toContain("prompt.question");
    expect(script).not.toContain("console.log(serviceRoleKey)");
    expect(route).not.toContain("APP_SUPABASE_SERVICE_ROLE_KEY");
    expect(route).not.toContain("createClient(");
    expect(access).not.toContain("APP_SUPABASE_SERVICE_ROLE_KEY");

    const normalRoute = await Bun.file(new URL("../src/routes/_app.home.tsx", import.meta.url)).text();
    expect(normalRoute).not.toContain("getPlatformAdminAccess");
  });
});
