import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  pinnedForA: boolean;
  pinnedForB: boolean;
  gesture: string | null;
  settings: { twoFactor: boolean; payment: string; language: string };
  moreMenu: string[];
  tripKey: string;
  dispatcherKey: string;
  databases: Array<string | undefined>;
  networkCalls: number;
};

test("Fase 1H-4 — pin, gestos, settings e corrida sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1h-4-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1h-4-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1H-4</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1h-4-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1h4Harness.snapshot()");

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
      "window.__connexyMvp1h4Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.pinnedForA).toBe(false);
    expect(initial.moreMenu).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    expect(initial.gesture).toBe("listen");
    expect(initial.networkCalls).toBe(0);

    const pinned = await evaluate<Snapshot>(
      cdp,
      sessionId,
      'window.__connexyMvp1h4Harness.pin("lucas", true)',
    );
    expect(pinned.pinnedForA).toBe(true);
    expect(pinned.pinnedForB).toBe(false);

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.pinnedForA).toBe(true);
    expect(reloaded.pinnedForB).toBe(false);

    const asB = await evaluate<Snapshot>(
      cdp,
      sessionId,
      'window.__connexyMvp1h4Harness.asIdentity("beatriz")',
    );
    expect(asB.identity.id).toBe("beatriz");
    expect(asB.pinnedForA).toBe(true);
    expect(asB.pinnedForB).toBe(false);

    await evaluate(cdp, sessionId, 'window.__connexyMvp1h4Harness.asIdentity("lucas")');
    const unpinned = await evaluate<Snapshot>(
      cdp,
      sessionId,
      'window.__connexyMvp1h4Harness.pin("lucas", false)',
    );
    expect(unpinned.pinnedForA).toBe(false);

    await reload();
    const unpinnedReload = await snapshot();
    expect(unpinnedReload.pinnedForA).toBe(false);

    const listened = await evaluate<Snapshot>(cdp, sessionId, "window.__connexyMvp1h4Harness.listen()");
    expect(listened.gesture).toBeNull();

    const settings = await evaluate<Snapshot>(
      cdp,
      sessionId,
      "window.__connexyMvp1h4Harness.saveSettings()",
    );
    expect(settings.settings.language).toBe("English");
    expect(settings.settings.twoFactor).toBe(true);
    await reload();
    const settingsReload = await snapshot();
    expect(settingsReload.settings.language).toBe("English");
    expect(settingsReload.settings.payment).toBe("Pix");
    expect(settingsReload.tripKey).toBe("connexy_demo_trip");
    expect(settingsReload.dispatcherKey).toBe("connexy_demo_dispatcher");
    expect(settingsReload.networkCalls).toBe(0);
  } finally {
    chrome.kill();
    server.stop(true);
    await rm(bundleDirectory, { recursive: true, force: true });
    await rm(browserProfile, { recursive: true, force: true });
  }
});
