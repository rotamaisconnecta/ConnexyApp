import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  photoRoute: string;
  videoRoute: string;
  textRoute: string;
  postRoute: string;
  rideRoute: string;
  rideCanonical: string;
  reelRoute: string;
  reelCanonical: string;
  unavailable: string;
  postsKey: string;
  publishedIds: string[];
  storedCount: number;
  networkCalls: number;
};

test("Fase 1F-3 — Create Hub conecta fluxos existentes e persiste publicação canônica", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-3-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/create-hub-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-3 Create Hub</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-3-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f3Harness.snapshot()");

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
      "window.__connexyMvp1f3Harness.reset()",
    );
    expect(initial.photoRoute).toBe("/create-post");
    expect(initial.videoRoute).toBe("/create-post");
    expect(initial.textRoute).toBe("/create-post");
    expect(initial.postRoute).toBe("/create-post");
    expect(initial.rideRoute).toBe("/ride/request");
    expect(initial.rideCanonical).toBe("/ride/request");
    expect(initial.reelRoute).toBe("/gerenciar/novo-reel");
    expect(initial.reelCanonical).toBe("/gerenciar/novo-reel");
    expect(initial.unavailable).toContain("ainda não está disponível");
    expect(initial.postsKey).toBe("connexy:demo:posts");
    expect(initial.publishedIds).toEqual([]);
    expect(initial.networkCalls).toBe(0);

    const published = await evaluate<Snapshot & { id: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1f3Harness.publishFromCanonicalPostFlow()",
    );
    expect(published.publishedIds).toEqual([published.id]);
    expect(published.storedCount).toBe(1);
    expect(published.networkCalls).toBe(0);

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.publishedIds).toEqual([published.id]);
    expect(reloaded.storedCount).toBe(1);
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
