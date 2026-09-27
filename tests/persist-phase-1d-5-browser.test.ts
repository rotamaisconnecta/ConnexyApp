import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type InboxItem = {
  kind: "conversation_invite" | "group_invite";
  id: string;
  requestId?: string;
  groupId?: string;
  fromUserId?: string;
  toUserId?: string;
};

type Snapshot = {
  identity: { id: string };
  inbox: InboxItem[];
  pending: Array<{ id: string; fromUserId: string; toUserId: string }>;
  history: Array<{
    id: string;
    status: string;
    origin: { label: string };
    destination: { label: string } | null;
    stops: Array<{ label: string }>;
    paymentMethod: string;
    paymentConfirmed: boolean;
  }>;
  presence: string;
  presenceKey: string | null;
  mode: string;
  rolesRaw: string | null;
  parallelInviteSource: string | null;
  parallelNotificationStore: string | null;
  storageKeys: string[];
  networkCalls: number;
};

test("Fase 1D-5 — inbox, histórico e settings sobrevivem a reload real", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1d-5-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1d-5-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1D-5 reload test</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1d-5-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1d5Harness.snapshot()");

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
      "window.__connexyMvp1d5Harness.reset()",
    );
    expect(initial.inbox).toEqual([]);
    expect(initial.history).toEqual([]);
    expect(initial.presence).toBe("invisible");

    const invite = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1d5Harness.invite("beatriz", "Convite 1D-5")`,
    );
    const duplicate = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1d5Harness.invite("beatriz", "Convite repetido")`,
    );
    expect(duplicate.id).toBe(invite.id);

    await reload();
    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.asIdentity("beatriz")`);
    const recipient = await snapshot();
    expect(recipient.inbox).toHaveLength(1);
    expect(recipient.inbox[0]).toMatchObject({
      kind: "conversation_invite",
      requestId: invite.id,
      fromUserId: "lucas",
      toUserId: "beatriz",
    });
    expect(recipient.pending).toHaveLength(1);
    expect(recipient.parallelInviteSource).toBeNull();
    expect(recipient.parallelNotificationStore).toBeNull();

    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.accept("lucas")`);
    expect((await snapshot()).inbox).toEqual([]);

    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.asIdentity("lucas")`);
    const group = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1d5Harness.createGroup("beatriz", "Grupo 1D-5")`,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.asIdentity("beatriz")`);
    expect((await snapshot()).inbox).toMatchObject([{ kind: "group_invite", groupId: group.id }]);
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1d5Harness.respondGroup(${JSON.stringify(group.id)}, true)`,
    );
    expect((await snapshot()).inbox).toEqual([]);

    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.asIdentity("lucas")`);
    const ride = await evaluate<{ tripId: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1d5Harness.completeRide()",
    );
    const afterRide = await snapshot();
    expect(afterRide.history.filter((trip) => trip.id === ride.tripId)).toHaveLength(1);
    expect(afterRide.history.find((trip) => trip.id === ride.tripId)).toMatchObject({
      status: "conclusao",
      origin: { label: "Origem 1D-5" },
      destination: { label: "Destino 1D-5" },
      paymentMethod: "pix",
      paymentConfirmed: true,
    });
    expect(
      afterRide.history.find((trip) => trip.id === ride.tripId)?.stops.map((stop) => stop.label),
    ).toEqual(["Parada 1D-5"]);

    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.setPresence("available")`);
    await evaluate(cdp, sessionId, `window.__connexyMvp1d5Harness.setMode("driver")`);
    await reload();
    const reloaded = await snapshot();
    expect(reloaded.history.filter((trip) => trip.id === ride.tripId)).toHaveLength(1);
    expect(reloaded.inbox).toEqual([]);
    expect(reloaded.presence).toBe("available");
    expect(reloaded.presenceKey).toBe("available");
    expect(reloaded.mode).toBe("DRIVER");
    expect(reloaded.parallelInviteSource).toBeNull();
    expect(reloaded.parallelNotificationStore).toBeNull();
    expect(reloaded.networkCalls).toBe(0);
    expect(reloaded.storageKeys.filter((key) => key === "connexy.presence.preference")).toEqual([
      "connexy.presence.preference",
    ]);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
