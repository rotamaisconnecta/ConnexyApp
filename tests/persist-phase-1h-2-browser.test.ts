import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  moreMenu: string[];
  pulseKinds: string[];
  pulseCount: number;
  nearbyTotal: number;
  nearbyFirst: number;
  nearbySecond: number;
  nearbyIds: string[];
  reservationsA: Array<{ id: string; status: string; userId: string }>;
  reservationsB: string[];
  offers: string[];
  reelsDb: string;
  parallel: { pulse: string | null; agora: string | null; restaurant: string | null };
  networkCalls: number;
};

test("Fase 1H-2 — Pulse, Perto de você, reserva e carona sobrevivem sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1h-2-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1h-2-browser.ts"),
      "--target=browser",
      "--format=iife",
      `--outfile=${bundlePath}`,
      "--tsconfig-override=tsconfig.json",
      "--define",
      "import.meta.env.DEV=true",
      "--define",
      'import.meta.env.VITE_APP_DEMO_MODE="true"',
      "--define",
      'import.meta.env.VITE_APP_SUPABASE_URL=""',
      "--define",
      'import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY=""',
    ],
    { cwd: projectRoot, stdout: "pipe", stderr: "pipe" },
  );
  expect(bundle.exitCode).toBe(0);

  const browserScript = await readFile(bundlePath, "utf8");
  const server = Bun.serve({
    port: 0,
    fetch: () =>
      new Response("<!doctype html><html><body>Connexy 1H-2</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1h-2-reload-"));
  const chrome = Bun.spawn(
    [
      chromeBinary(),
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-background-networking",
      "--remote-debugging-port=0",
      `--user-data-dir=${browserProfile}`,
      "about:blank",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  let cdp: CdpClient | null = null;
  let sessionId = "";
  const installHarness = () => evaluate(cdp!, sessionId, browserScript);
  const reload = async () => {
    const loaded = cdp!.waitForEvent("Page.loadEventFired", sessionId);
    await cdp!.send("Page.reload", { ignoreCache: true }, sessionId);
    await loaded;
    await installHarness();
  };
  const snapshot = () =>
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1h2Harness.snapshot()");

  try {
    cdp = await CdpClient.connect(await devtoolsUrl(chrome.stderr));
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    const attached = await cdp.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: true,
    });
    sessionId = String(attached.sessionId);
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    const initialLoad = cdp.waitForEvent("Page.loadEventFired", sessionId);
    await cdp.send("Page.navigate", { url: String(server.url) }, sessionId);
    await initialLoad;
    await installHarness();

    const initial = await evaluate<Snapshot>(
      cdp,
      sessionId,
      "window.__connexyMvp1h2Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.moreMenu).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    expect(initial.pulseCount).toBeGreaterThan(0);
    expect(initial.pulseKinds).toContain("business");
    expect(initial.pulseKinds).toContain("event");
    expect(initial.nearbyFirst).toBe(5);
    expect(initial.nearbySecond).toBe(10);
    expect(new Set(initial.nearbyIds).size).toBe(10);
    expect(initial.reelsDb).toBe("connexy-reels-data-local-db");
    expect(initial.parallel.pulse).toBeNull();
    expect(initial.networkCalls).toBe(0);

    const reservation = await evaluate<{ id: string; status: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1h2Harness.reserve()",
    );
    expect(reservation.status).toBe("confirmed");
    const offer = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1h2Harness.publishRide()",
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1h2Harness.asIdentity("beatriz")`);
    const request = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1h2Harness.requestRide(${JSON.stringify(offer.id)})`,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1h2Harness.asIdentity("lucas")`);
    const accepted = await evaluate<{ status: string; conversationId?: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1h2Harness.acceptRide(${JSON.stringify(request.id)})`,
    );
    expect(accepted.status).toBe("accepted");
    expect(accepted.conversationId).toBeTruthy();

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.reservationsA[0]?.id).toBe(reservation.id);
    expect(reloaded.reservationsA[0]?.status).toBe("confirmed");
    expect(reloaded.reservationsB).toEqual([]);
    expect(reloaded.moreMenu).toEqual(initial.moreMenu);
    expect(reloaded.parallel.restaurant).toBeNull();
    expect(reloaded.networkCalls).toBe(0);

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1h2Harness.cancel(${JSON.stringify(reservation.id)})`,
    );
    expect((await snapshot()).reservationsA[0]?.status).toBe("cancelled");
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 60_000);
