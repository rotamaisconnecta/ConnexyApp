import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  burger: string[];
  burgerCase: string[];
  emptyQueryCafes: string[];
  burgerAndCafes: string[];
  none: string[];
  sunset: { id: string; title: string } | undefined;
  sunsetNav: { to: string; params: { eventId: string } } | null;
  sunsetDetail: { id: string; title: string } | null;
  savedIds: string[];
  b1Saved: boolean;
  savedKey: string;
  outingKey: string;
  parallelFavoriteKey: string | null;
  storageKeys: string[];
  networkCalls: number;
};

test("Fase 1F-1 — busca, evento e favorito sobrevivem no browser real", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-1-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/explore-locais-browser.ts"),
      "--target=browser",
      "--format=iife",
      `--outfile=${bundlePath}`,
      "--tsconfig-override=tsconfig.json",
      "--define",
      "import.meta.env.DEV=true",
      "--define",
      'import.meta.env.VITE_APP_DEMO_MODE="true"',
    ],
    { cwd: projectRoot, stdout: "pipe", stderr: "pipe" },
  );
  expect(bundle.exitCode).toBe(0);

  const browserScript = await readFile(bundlePath, "utf8");
  const server = Bun.serve({
    port: 0,
    fetch: () =>
      new Response("<!doctype html><html><body>Connexy 1F-1 reload test</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-1-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f1Harness.snapshot()");

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
      "window.__connexyMvp1f1Harness.reset()",
    );
    expect(initial.burger).toEqual(["burger-house"]);
    expect(initial.burgerCase).toEqual(["burger-house"]);
    expect(initial.emptyQueryCafes).toEqual(["cafe-central"]);
    expect(initial.burgerAndCafes).toEqual([]);
    expect(initial.none).toEqual([]);
    expect(initial.sunset).toMatchObject({ id: "sunset-parque", title: "Sunset no Parque" });
    expect(initial.sunsetNav).toEqual({
      to: "/event/$eventId",
      params: { eventId: "sunset-parque" },
    });
    expect(initial.sunsetDetail).toMatchObject({
      id: "sunset-parque",
      title: "Sunset no Parque",
    });
    expect(initial.savedKey).toBe("connexy:demo:saved-details");
    expect(initial.outingKey).toBe("connexy:demo:outing-invites");
    expect(initial.b1Saved).toBe(false);

    await evaluate(cdp, sessionId, `window.__connexyMvp1f1Harness.favorite("b1")`);
    expect((await snapshot()).savedIds).toEqual(["b1"]);

    await reload();
    const afterReload = await snapshot();
    expect(afterReload.b1Saved).toBe(true);
    expect(afterReload.savedIds).toEqual(["b1"]);
    expect(afterReload.parallelFavoriteKey).toBeNull();
    expect(afterReload.storageKeys.filter((key) => key === "connexy:demo:saved-details")).toEqual([
      "connexy:demo:saved-details",
    ]);

    await evaluate(cdp, sessionId, `window.__connexyMvp1f1Harness.favorite("b1")`);
    await reload();
    const unfavorited = await snapshot();
    expect(unfavorited.b1Saved).toBe(false);
    expect(unfavorited.savedIds).toEqual([]);
    expect(unfavorited.networkCalls).toBe(0);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
