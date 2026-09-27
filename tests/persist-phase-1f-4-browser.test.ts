import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  unavailable: string;
  reelRoute: string;
  negocio: string;
  evento: string;
  local: string;
  oferta: string;
  storageKeys: string[];
  networkCalls: number;
};

test("Fase 1F-4 — Meu Connexy não persiste cadastro falso e não chama rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-4-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/my-connexy-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-4 Meu Connexy</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-4-reload-"));
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
    await evaluate(cdp, sessionId, browserScript);

    const initial = await evaluate<Snapshot>(
      cdp,
      sessionId,
      "window.__connexyMvp1f4Harness.reset()",
    );
    expect(initial.unavailable).toContain("ainda não está disponível");
    expect(initial.negocio).toBe("/create/place-business");
    expect(initial.evento).toBe("/create/event");
    expect(initial.local).toBe("/create/place");
    expect(initial.oferta).toBe("/create/offer");
    expect(initial.reelRoute).toBe("/gerenciar/novo-reel");
    expect(initial.storageKeys).toEqual([]);
    expect(initial.networkCalls).toBe(0);

    const loaded = cdp.waitForEvent("Page.loadEventFired", sessionId);
    await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
    await loaded;
    await evaluate(cdp, sessionId, browserScript);
    const reloaded = await evaluate<Snapshot>(
      cdp,
      sessionId,
      "window.__connexyMvp1f4Harness.snapshot()",
    );
    expect(reloaded.storageKeys).toEqual([]);
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
