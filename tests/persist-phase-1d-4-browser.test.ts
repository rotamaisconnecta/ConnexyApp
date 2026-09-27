import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type TripStatus =
  | "rota"
  | "buscando"
  | "encontrado"
  | "emviagem"
  | "parada"
  | "chegada"
  | "conclusao"
  | "cancelada";

type TripSnapshot = {
  identity: { id: string; name: string };
  trip: {
    id: string;
    status: TripStatus;
    origin: { label: string };
    destination: { label: string };
    stops: Array<{ id: string; label: string; order: number }>;
    paymentMethod: "pix" | "dinheiro";
    paymentConfirmed: boolean;
    paymentIssue?: "user_not_paid";
    userId: string;
    driver: { id: string } | null;
    currentStopIndex: number;
    startedAt: string | null;
    completedAt: string | null;
    finalFare: number | null;
    estimatedFare: number;
    source?: string;
    companionLabel?: string;
    cancelledBy?: "passenger" | "driver";
  } | null;
  history: Array<{
    id: string;
    status: TripStatus;
    stops: Array<{ order: number }>;
    paymentMethod: "pix" | "dinheiro";
    paymentConfirmed: boolean;
    paymentIssue?: "user_not_paid";
    userId: string;
    driver: { id: string } | null;
    finalFare: number | null;
    completedAt: string | null;
    cancelledBy?: "passenger" | "driver";
  }>;
  blocks: Record<string, { tripId: string; issue: "user_not_paid" }>;
  dispatch: {
    entries: Array<{
      tripId: string;
      status: string;
      assigningDriverId: string | null;
      assignedDriverId: string | null;
      declinedDriverIds: string[];
      request: { meta: { passengerName: string } };
    }>;
    fleet: Array<{ id: string; status: string }>;
    events: Array<{ type: string; tripId: string; driverId?: string }>;
  };
  networkCalls: number;
  storageKeys: string[];
};

test("Fase 1D-4 — Mobility completa, recuperável e sem duplicação", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-mobility-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mobility-trip-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy Mobility 1D-4</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-mobility-profile-"));
  const chrome = Bun.spawn(
    [
      chromeBinary(),
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-background-networking",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--mute-audio",
      "--remote-debugging-port=0",
      `--user-data-dir=${browserProfile}`,
      "about:blank",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  let cdp: CdpClient | null = null;
  let sessionId = "";
  const installHarness = () => evaluate(cdp!, sessionId, browserScript);
  const snapshot = () =>
    evaluate<TripSnapshot>(cdp!, sessionId, "window.__connexyMobilityHarness.snapshot()");
  const action = <T>(expression: string) => evaluate<T>(cdp!, sessionId, expression);
  const reload = async () => {
    const loaded = cdp!.waitForEvent("Page.loadEventFired", sessionId, 15_000);
    await cdp!.send("Page.reload", { ignoreCache: true }, sessionId);
    await loaded;
    await installHarness();
  };

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

    await action("window.__connexyMobilityHarness.reset()");

    const zeroStops = await action<TripSnapshot["trip"]>(
      'window.__connexyMobilityHarness.createScenario(0, "dinheiro")',
    );
    const duplicateCreate = await action<TripSnapshot["trip"]>(
      'window.__connexyMobilityHarness.createScenario(3, "pix")',
    );
    expect(zeroStops?.id).toBe(duplicateCreate?.id);
    expect(zeroStops?.userId).toBe("lucas");
    expect(zeroStops?.origin.label).toBe("Origem 1D-4");
    expect(zeroStops?.destination.label).toBe("Destino 1D-4");
    expect(zeroStops?.stops).toEqual([]);

    await action('window.__connexyMobilityHarness.request("dinheiro")');
    const requested = await snapshot();
    expect(requested.trip).toMatchObject({
      status: "buscando",
      paymentMethod: "dinheiro",
      userId: "lucas",
    });
    expect(requested.dispatch.entries).toHaveLength(1);
    expect(requested.dispatch.entries[0].request.meta.passengerName).toBe(requested.identity.name);
    expect(requested.dispatch.entries[0].assigningDriverId).toBe("marcos");

    await action("window.__connexyMobilityHarness.requestAgain()");
    expect((await snapshot()).dispatch.entries).toHaveLength(1);
    const declined = await action<{
      driverId: string;
      entry: { assigningDriverId: string; declinedDriverIds: string[] };
    }>("window.__connexyMobilityHarness.decline()");
    expect(declined.driverId).toBe("marcos");
    expect(declined.entry.declinedDriverIds).toContain("marcos");
    expect(declined.entry.assigningDriverId).not.toBe("marcos");

    const accepted = await action<{
      accepted: boolean;
      driverId: string;
      trip: TripSnapshot["trip"];
    }>("window.__connexyMobilityHarness.accept()");
    expect(accepted.accepted).toBe(true);
    expect(accepted.trip?.status).toBe("encontrado");
    expect(accepted.trip?.driver?.id).toBe(accepted.driverId);
    await action("window.__connexyMobilityHarness.start()");
    expect((await snapshot()).trip).toMatchObject({
      status: "emviagem",
      currentStopIndex: 0,
    });
    expect((await snapshot()).trip?.startedAt).not.toBeNull();
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip?.status).toBe("chegada");
    await action("window.__connexyMobilityHarness.finish()");
    expect((await snapshot()).trip?.status).toBe("avaliacao");
    expect((await snapshot()).history).toEqual([]);
    await action("window.__connexyMobilityHarness.confirmPayment()");
    await action("window.__connexyMobilityHarness.finish()");
    const cashComplete = await snapshot();
    const cashTripId = cashComplete.trip!.id;
    expect(cashComplete.trip).toMatchObject({
      status: "conclusao",
      paymentMethod: "dinheiro",
      paymentConfirmed: true,
    });
    expect(cashComplete.trip?.finalFare).toBe(cashComplete.trip?.estimatedFare);
    expect(cashComplete.trip?.completedAt).not.toBeNull();
    expect(cashComplete.history.map((trip) => trip.id)).toEqual([cashTripId]);

    await action('window.__connexyMobilityHarness.createScenario(1, "pix")');
    await action('window.__connexyMobilityHarness.request("pix")');
    await action("window.__connexyMobilityHarness.accept()");
    await action("window.__connexyMobilityHarness.start()");
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip).toMatchObject({ status: "parada", currentStopIndex: 0 });
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip).toMatchObject({ status: "chegada", currentStopIndex: 1 });
    await action("window.__connexyMobilityHarness.confirmPayment()");
    await action("window.__connexyMobilityHarness.finish()");
    expect((await snapshot()).history).toHaveLength(2);

    await action('window.__connexyMobilityHarness.createScenario(2, "dinheiro")');
    await action('window.__connexyMobilityHarness.request("dinheiro")');
    await action("window.__connexyMobilityHarness.accept()");
    await action("window.__connexyMobilityHarness.start()");
    await action("window.__connexyMobilityHarness.advance()");
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip).toMatchObject({ status: "emviagem", currentStopIndex: 1 });
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip).toMatchObject({ status: "parada", currentStopIndex: 1 });
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip).toMatchObject({ status: "chegada", currentStopIndex: 2 });
    await action("window.__connexyMobilityHarness.confirmPayment()");
    await action("window.__connexyMobilityHarness.finish()");
    expect((await snapshot()).history).toHaveLength(3);

    const capped = await action<TripSnapshot["trip"]>(
      'window.__connexyMobilityHarness.createScenario(4, "pix")',
    );
    expect(capped?.stops).toHaveLength(3);
    expect(capped?.stops.map((stop) => stop.order)).toEqual([1, 2, 3]);
    await action('window.__connexyMobilityHarness.request("pix")');
    await action("window.__connexyMobilityHarness.accept()");
    await action("window.__connexyMobilityHarness.start()");
    const threeStopTripId = (await snapshot()).trip!.id;
    await action("window.__connexyMobilityHarness.advance()");
    expect((await snapshot()).trip?.status).toBe("parada");

    await reload();
    const recoveredMidTrip = await snapshot();
    expect(recoveredMidTrip.trip?.id).toBe(threeStopTripId);
    expect(recoveredMidTrip.trip).toMatchObject({ status: "parada", currentStopIndex: 0 });
    expect(recoveredMidTrip.trip?.driver).not.toBeNull();

    for (let index = 0; index < 5; index += 1) {
      await action("window.__connexyMobilityHarness.advance()");
    }
    expect((await snapshot()).trip).toMatchObject({ status: "chegada", currentStopIndex: 3 });
    await action("window.__connexyMobilityHarness.confirmPayment()");
    await action("window.__connexyMobilityHarness.finish()");
    await reload();
    const completedAfterReload = await snapshot();
    expect(completedAfterReload.trip?.id).toBe(threeStopTripId);
    expect(completedAfterReload.trip?.status).toBe("conclusao");
    expect(completedAfterReload.history).toHaveLength(4);
    expect(new Set(completedAfterReload.history.map((trip) => trip.id)).size).toBe(4);

    const companions = ["Ana", "Bia", "Caio", "Duda"].map((name, index) => ({
      id: `friend-${index}`,
      name,
      address: `Endereço ${index + 1}`,
      lat: -23.551 - index / 1000,
      lng: -46.641,
    }));
    const together = await action<TripSnapshot["trip"]>(
      `window.__connexyMobilityHarness.createTogether(${JSON.stringify(companions)})`,
    );
    expect(together).toMatchObject({ source: "invite", companionLabel: "Ir juntos" });
    expect(together?.stops).toHaveLength(3);
    await action('window.__connexyMobilityHarness.request("pix")');
    await action("window.__connexyMobilityHarness.cancelPassenger()");
    const passengerCancelled = await snapshot();
    expect(passengerCancelled.trip).toMatchObject({
      status: "cancelada",
      cancelledBy: "passenger",
    });
    expect(passengerCancelled.history).toHaveLength(5);

    await action('window.__connexyMobilityHarness.createScenario(0, "pix")');
    await action('window.__connexyMobilityHarness.request("pix")');
    await action("window.__connexyMobilityHarness.accept()");
    await action("window.__connexyMobilityHarness.cancelDriver()");
    const reassigned = await snapshot();
    expect(reassigned.trip).toMatchObject({ status: "buscando", driver: null });
    expect(reassigned.dispatch.entries.at(-1)?.declinedDriverIds.length).toBeGreaterThan(0);
    await action("window.__connexyMobilityHarness.accept()");
    await action("window.__connexyMobilityHarness.start()");
    await action("window.__connexyMobilityHarness.cancelDriver()");
    const driverCancelled = await snapshot();
    expect(driverCancelled.trip).toMatchObject({
      status: "cancelada",
      cancelledBy: "driver",
    });
    expect(driverCancelled.history).toHaveLength(6);

    await action('window.__connexyMobilityHarness.asIdentity("beatriz")');
    await action('window.__connexyMobilityHarness.createScenario(0, "pix")');
    await action('window.__connexyMobilityHarness.request("pix")');
    await action("window.__connexyMobilityHarness.accept()");
    await action("window.__connexyMobilityHarness.start()");
    await action("window.__connexyMobilityHarness.advance()");
    await action("window.__connexyMobilityHarness.markUnpaid()");
    await action("window.__connexyMobilityHarness.markUnpaid()");
    const unpaid = await snapshot();
    const unpaidTripId = unpaid.trip!.id;
    expect(unpaid.trip).toMatchObject({
      status: "chegada",
      paymentMethod: "pix",
      paymentConfirmed: false,
      paymentIssue: "user_not_paid",
      userId: "beatriz",
    });
    expect(Object.keys(unpaid.blocks)).toEqual(["beatriz"]);
    expect(unpaid.blocks.beatriz).toMatchObject({
      tripId: unpaidTripId,
      issue: "user_not_paid",
    });
    await action("window.__connexyMobilityHarness.finish()");
    expect((await snapshot()).history).toHaveLength(7);

    await reload();
    const unpaidReloaded = await snapshot();
    expect(unpaidReloaded.trip?.id).toBe(unpaidTripId);
    expect(unpaidReloaded.trip?.status).toBe("conclusao");
    expect(unpaidReloaded.blocks.beatriz.tripId).toBe(unpaidTripId);
    const blocked = await action<{ trip: null; error: string }>(
      "window.__connexyMobilityHarness.attemptNewTrip()",
    );
    expect(blocked.trip).toBeNull();
    expect(blocked.error).toContain("bloqueado");
    expect(await action<boolean>('window.__connexyMobilityHarness.unblock("beatriz")')).toBe(false);
    const unblocked = await action<{ trip: TripSnapshot["trip"]; error: null }>(
      "window.__connexyMobilityHarness.attemptNewTrip()",
    );
    expect(unblocked.error).toBeNull();
    expect(unblocked.trip?.userId).toBe("beatriz");

    const failedWrite = await action<{
      before: TripSnapshot["trip"];
      after: TripSnapshot["trip"];
      error: string;
    }>("window.__connexyMobilityHarness.failNextTripWrite()");
    expect(failedWrite.error).toContain("salvar");
    expect(failedWrite.after).toEqual(failedWrite.before);

    const finalSnapshot = await snapshot();
    expect(new Set(finalSnapshot.history.map((trip) => trip.id)).size).toBe(
      finalSnapshot.history.length,
    );
    expect(finalSnapshot.networkCalls).toBe(0);
    expect(finalSnapshot.storageKeys).toContain("connexy_demo_trip");
    expect(finalSnapshot.storageKeys).toContain("connexy_demo_ride_blocks");
    expect(finalSnapshot.storageKeys).toContain("connexy_demo_dispatcher");
    expect(finalSnapshot.storageKeys.some((key) => key.includes("supabase"))).toBe(false);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 60_000);
