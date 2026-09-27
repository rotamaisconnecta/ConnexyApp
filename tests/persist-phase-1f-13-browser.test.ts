import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  catalogKey: string;
  postsKey: string;
  moreMenu: string[];
  ownerIds: string[];
  ids: string[];
  kinds: string[];
  eventOverlay: string | null;
  placeOverlay: string | null;
  businessOverlay: string | null;
  offerOverlay: boolean;
  offerBusinessId: string | null;
  savedDetails: string | null;
  fixturePlace: boolean;
  fixtureBusiness: boolean;
  storedCount: number;
  lookup: {
    event: string | null;
    place: string | null;
    business: string | null;
    offer: string | null;
  };
  parallelKeys: {
    events: string | null;
    places: string | null;
    posts: string | null;
  };
  networkCalls: number;
};

test("Fase 1F-13 — catálogo dos quatro tipos e menu Mais sobrevivem ao reload", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-13-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-13-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-13 Catalog</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-13-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f13Harness.snapshot()");

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
      "window.__connexyMvp1f13Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.catalogKey).toBe("connexy:demo:catalog");
    expect(initial.postsKey).toBe("connexy:demo:posts");
    expect(initial.moreMenu).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    expect(initial.storedCount).toBe(0);
    expect(initial.networkCalls).toBe(0);

    const published = await evaluate<
      Snapshot & {
        eventId: string;
        placeId: string;
        businessId: string;
        offerId: string;
        ownerId: string;
      }
    >(cdp, sessionId, "window.__connexyMvp1f13Harness.publishCatalog()");
    expect(published.ownerId).toBe("lucas");
    expect(published.ownerIds.every((id) => id === "lucas")).toBe(true);
    expect(published.offerBusinessId).toBe(published.businessId);
    expect(published.eventOverlay).toBe(published.eventId);
    expect(published.placeOverlay).toBe(published.placeId);
    expect(published.businessOverlay).toBe(published.businessId);
    expect(published.offerOverlay).toBe(true);
    expect(published.savedDetails).toBeNull();
    expect(published.fixturePlace).toBe(true);
    expect(published.fixtureBusiness).toBe(true);
    expect(published.parallelKeys).toEqual({ events: null, places: null, posts: null });
    expect(published.networkCalls).toBe(0);

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.moreMenu).toEqual(published.moreMenu);
    expect(reloaded.storedCount).toBe(4);
    expect(reloaded.ids.sort()).toEqual(published.ids.sort());
    expect(reloaded.lookup).toEqual({
      event: published.eventId,
      place: published.placeId,
      business: published.businessId,
      offer: published.offerId,
    });
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
