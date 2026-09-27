import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  invites: Array<{ id: string; fromUserId: string; personId: string; status: string }>;
  inbox: Array<{ kind: string; inviteId?: string; status?: string; requestId?: string }>;
  rideAvailable: boolean;
  rideSearch: { source?: string; destinationId?: string } | null;
  trip: { id: string; source?: string | null; companionLabel?: string } | null;
  outingKey: string;
  parallelOutingKey: string | null;
  catalogNotificationIds: string[];
  networkCalls: number;
};

test("Fase 1F-6 — Ir juntos aceita, recusa e habilita Trip sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-6-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-6-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-6 Ir juntos</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-6-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f6Harness.snapshot()");

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
      "window.__connexyMvp1f6Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.invites).toEqual([]);
    expect(initial.inbox).toEqual([]);
    expect(initial.rideAvailable).toBe(false);
    expect(initial.trip).toBeNull();
    expect(initial.outingKey).toBe("connexy:demo:outing-invites");
    expect(initial.parallelOutingKey).toBeNull();
    expect(initial.catalogNotificationIds).toEqual([]);
    expect(initial.networkCalls).toBe(0);

    const sent = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1f6Harness.sendOuting()",
    );
    const afterSend = await snapshot();
    expect(afterSend.invites).toHaveLength(1);
    expect(afterSend.invites[0]).toMatchObject({
      id: sent.id,
      fromUserId: "lucas",
      personId: "beatriz",
      status: "pending",
    });
    expect(afterSend.rideAvailable).toBe(false);
    expect(afterSend.rideSearch).toBeNull();
    expect(afterSend.inbox).toEqual([]);

    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("beatriz")`);
    const asB = await snapshot();
    expect(asB.identity.id).toBe("beatriz");
    expect(asB.inbox).toHaveLength(1);
    expect(asB.inbox[0]).toMatchObject({
      kind: "outing_invite",
      inviteId: sent.id,
      status: "pending",
    });

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f6Harness.respondOuting(${JSON.stringify(sent.id)}, true)`,
    );
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f6Harness.respondOuting(${JSON.stringify(sent.id)}, true)`,
    );
    const accepted = await snapshot();
    expect(accepted.invites[0]?.status).toBe("accepted");
    expect(accepted.inbox[0]).toMatchObject({ status: "accepted" });
    expect(accepted.rideAvailable).toBe(true);

    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("lucas")`);
    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("rafael")`);
    const stranger = await evaluate<{ status?: string } | null>(
      cdp,
      sessionId,
      `window.__connexyMvp1f6Harness.respondOuting(${JSON.stringify(sent.id)}, false)`,
    );
    expect(stranger?.status).toBe("accepted");

    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("lucas")`);
    const asA = await snapshot();
    expect(asA.rideAvailable).toBe(true);
    expect(asA.rideSearch).toMatchObject({ source: "invite", destinationId: "cafe-central" });
    expect(asA.inbox).toEqual([]);

    const firstTrip = await evaluate<{ id: string; source?: string; companionLabel?: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1f6Harness.openRide()",
    );
    const secondTrip = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1f6Harness.openRide()",
    );
    expect(firstTrip.source).toBe("invite");
    expect(firstTrip.companionLabel).toBe("Ir juntos");
    expect(secondTrip.id).toBe(firstTrip.id);

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.invites).toHaveLength(1);
    expect(reloaded.invites[0]?.status).toBe("accepted");
    expect(reloaded.rideAvailable).toBe(true);
    expect(reloaded.trip?.id).toBe(firstTrip.id);
    expect(reloaded.parallelOutingKey).toBeNull();
    expect(reloaded.catalogNotificationIds).toEqual([]);
    expect(reloaded.networkCalls).toBe(0);

    await evaluate(cdp, sessionId, "window.__connexyMvp1f6Harness.reset()");
    const declinedInvite = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1f6Harness.sendOuting()",
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("beatriz")`);
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f6Harness.respondOuting(${JSON.stringify(declinedInvite.id)}, false)`,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("lucas")`);
    const declined = await snapshot();
    expect(declined.invites[0]?.status).toBe("declined");
    expect(declined.rideAvailable).toBe(false);
    expect(declined.trip).toBeNull();
    expect(await evaluate(cdp, sessionId, "window.__connexyMvp1f6Harness.openRide()")).toBeNull();

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f6Harness.inviteFriend("beatriz", "lucas", "Oi")`,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1f6Harness.asIdentity("lucas")`);
    const withFriend = await snapshot();
    expect(withFriend.inbox.some((item) => item.kind === "conversation_invite")).toBe(true);
    expect(withFriend.catalogNotificationIds).toEqual([]);
    expect(withFriend.networkCalls).toBe(0);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
