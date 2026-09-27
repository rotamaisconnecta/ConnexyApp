import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  catalogKey: string;
  postsKey: string;
  ownerIds: string[];
  ids: string[];
  kinds: string[];
  eventOverlay: string | null;
  placeOverlay: string | null;
  businessOverlay: string | null;
  offerOverlay: boolean;
  fixtureBusiness: boolean;
  storedCount: number;
  raw: string | null;
  parallelKeys: {
    events: string | null;
    places: string | null;
    offers: string | null;
    businesses: string | null;
    posts: string | null;
  };
  lookup: {
    event: string | null;
    place: string | null;
    business: string | null;
    offer: string | null;
  };
  networkCalls: number;
};

test("Fase 1F-12 — catálogo local persiste os quatro tipos e sobrevive ao reload", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-12-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-12-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-12 Catalog</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-12-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f12Harness.snapshot()");

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
      "window.__connexyMvp1f12Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.catalogKey).toBe("connexy:demo:catalog");
    expect(initial.postsKey).toBe("connexy:demo:posts");
    expect(initial.storedCount).toBe(0);
    expect(initial.fixtureBusiness).toBe(true);
    expect(initial.networkCalls).toBe(0);

    const published = await evaluate<
      Snapshot & {
        eventId: string;
        placeId: string;
        businessId: string;
        offerId: string;
        ownerId: string;
      }
    >(cdp, sessionId, "window.__connexyMvp1f12Harness.publishCatalog()");
    expect(published.ownerId).toBe("lucas");
    expect(published.ownerIds).toEqual(["lucas", "lucas", "lucas", "lucas"]);
    expect(published.ids.sort()).toEqual(
      [published.eventId, published.placeId, published.businessId, published.offerId].sort(),
    );
    expect(published.kinds).toEqual(["business", "event", "offer", "place"]);
    expect(published.eventOverlay).toBe(published.eventId);
    expect(published.placeOverlay).toBe(published.placeId);
    expect(published.businessOverlay).toBe(published.businessId);
    expect(published.offerOverlay).toBe(true);
    expect(published.parallelKeys).toEqual({
      events: null,
      places: null,
      offers: null,
      businesses: null,
      posts: null,
    });
    expect(published.networkCalls).toBe(0);

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.identity.id).toBe("lucas");
    expect(reloaded.storedCount).toBe(4);
    expect(reloaded.ids.sort()).toEqual(published.ids.sort());
    expect(reloaded.eventOverlay).toBe(published.eventId);
    expect(reloaded.placeOverlay).toBe(published.placeId);
    expect(reloaded.businessOverlay).toBe(published.businessId);
    expect(reloaded.offerOverlay).toBe(true);
    expect(reloaded.lookup).toEqual({
      event: published.eventId,
      place: published.placeId,
      business: published.businessId,
      offer: published.offerId,
    });
    expect(reloaded.raw).toContain(published.eventId);
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
