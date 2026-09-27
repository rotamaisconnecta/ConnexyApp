import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  hubRoute: string;
  redirectTo: string;
  publishedIds: string[];
  feedHasPublished: boolean;
  storedCount: number;
  persistence: string;
  store: string;
  networkCalls: number;
};

test("Fase 1F-2 — Create Hub publica no fluxo canônico e sobrevive a reload", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-2-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/create-reel-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-2 Create Reel</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-2-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f2Harness.snapshot()");

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
      "window.__connexyMvp1f2Harness.reset()",
    );
    expect(initial.hubRoute).toBe("/gerenciar/novo-reel");
    expect(initial.redirectTo).toBe("/gerenciar/novo-reel");
    expect(initial.publishedIds).toEqual([]);
    expect(initial.persistence).toBe("connexy-reels-data-local-db");
    expect(initial.store).toBe("reels");

    const published = await evaluate<Snapshot & { id: string; publishMode: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1f2Harness.publishFromCanonicalFlow()",
    );
    expect(published.publishMode).toBe("local");
    expect(published.publishedIds).toEqual([published.id]);
    expect(published.storedCount).toBe(1);
    expect(published.feedHasPublished).toBe(true);
    expect(published.networkCalls).toBe(0);

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.publishedIds).toEqual([published.id]);
    expect(reloaded.storedCount).toBe(1);
    expect(reloaded.feedHasPublished).toBe(true);
    expect(reloaded.networkCalls).toBe(0);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
