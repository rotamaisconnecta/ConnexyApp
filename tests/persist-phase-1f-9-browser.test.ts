import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  trip: {
    id: string;
    status: string;
    driver: { id: string } | null;
    cancelledBy?: string;
  } | null;
  history: Array<{ id: string }>;
  entry: {
    status: string;
    assignedDriverId: string | null;
    assigningDriverId: string | null;
  } | null;
  fleet: Array<{ id: string; status: string }>;
  storageKeys: string[];
  dispatcherConfig: string | null;
  parallelKeys: { dispatch: string | null; dispatcherStore: string | null };
  networkCalls: number;
};

test("Fase 1F-9 — Dispatcher reconstrói atribuição após reload sem chave nova", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-9-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-9-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-9 Dispatcher</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-9-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f9Harness.snapshot()");
  const action = <T>(expression: string) => evaluate<T>(cdp!, sessionId, expression);

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

    const initial = await action<Snapshot>("window.__connexyMvp1f9Harness.reset()");
    expect(initial.trip).toBeNull();
    expect(initial.networkCalls).toBe(0);

    await action("window.__connexyMvp1f9Harness.createScenario()");
    await action('window.__connexyMvp1f9Harness.request("pix")');
    const requested = await snapshot();
    expect(requested.trip?.status).toBe("buscando");
    expect(requested.entry?.status).toBe("pending");
    expect(requested.entry?.assigningDriverId).toBe("marcos");

    const accepted = await action<{ accepted: boolean; driverId: string }>(
      "window.__connexyMvp1f9Harness.accept()",
    );
    expect(accepted.accepted).toBe(true);
    await action("window.__connexyMvp1f9Harness.start()");
    const inTrip = await snapshot();
    expect(inTrip.trip?.status).toBe("emviagem");
    expect(inTrip.trip?.driver?.id).toBe("marcos");
    expect(inTrip.entry?.status).toBe("assigned");
    const tripId = inTrip.trip!.id;

    const forgotten = await action<Snapshot>(
      "window.__connexyMvp1f9Harness.forgetDispatcherMemory()",
    );
    expect(forgotten.trip?.id).toBe(tripId);
    expect(forgotten.entry).toBeNull();
    expect(forgotten.fleet.find((driver) => driver.id === "marcos")?.status).toBe("available");

    const hydrated = await action<Snapshot>("window.__connexyMvp1f9Harness.hydrate()");
    expect(hydrated.entry?.status).toBe("assigned");
    expect(hydrated.entry?.assignedDriverId).toBe("marcos");
    expect(hydrated.fleet.find((driver) => driver.id === "marcos")?.status).toBe("busy");
    expect(hydrated.parallelKeys).toEqual({ dispatch: null, dispatcherStore: null });

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.trip?.id).toBe(tripId);
    expect(reloaded.trip?.status).toBe("emviagem");
    expect(reloaded.trip?.driver?.id).toBe("marcos");
    expect(reloaded.entry?.status).toBe("assigned");
    expect(reloaded.entry?.assignedDriverId).toBe("marcos");
    expect(reloaded.fleet.find((driver) => driver.id === "marcos")?.status).toBe("busy");
    expect(reloaded.storageKeys).toContain("connexy_demo_trip");
    expect(reloaded.storageKeys).toContain("connexy_demo_dispatcher");
    expect(reloaded.parallelKeys.dispatch).toBeNull();
    expect(JSON.parse(String(reloaded.dispatcherConfig))).toMatchObject({ autoAccept: false });
    expect(reloaded.networkCalls).toBe(0);

    const cancelled = await action<Snapshot>("window.__connexyMvp1f9Harness.cancelDriver()");
    expect(cancelled.trip?.status).toBe("cancelada");
    expect(cancelled.trip?.cancelledBy).toBe("driver");
    expect(cancelled.entry?.status).toBe("cancelled");
    expect(cancelled.history.some((item) => item.id === tripId)).toBe(true);
    expect(cancelled.networkCalls).toBe(0);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
