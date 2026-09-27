import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  reelId: string;
  authorId: string;
  following: boolean;
  followees: string[];
  saved: boolean;
  savedIds: string[];
  savedKey: string;
  connectStatus: string;
  connected: boolean;
  inbox: Array<{ kind: string }>;
  incoming: Array<{ fromUserId: string }>;
  applied: { savedByMe: boolean; isFollowing: boolean };
  parallelKeys: { follows: string | null; savedReels: string | null };
  catalogNotificationIds: string[];
  networkCalls: number;
};

test("Fase 1F-7 — Seguir, Guardar e Conectar sobrevivem sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-7-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-7-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-7 Reels residuais</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-7-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f7Harness.snapshot()");

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
      "window.__connexyMvp1f7Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.following).toBe(false);
    expect(initial.saved).toBe(false);
    expect(initial.connectStatus).toBe("available");
    expect(initial.parallelKeys.follows).toBeNull();
    expect(initial.parallelKeys.savedReels).toBeNull();
    expect(initial.networkCalls).toBe(0);

    expect(await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.follow()`)).toBe(true);
    expect(await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.save()`)).toBe(true);
    await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.favoritePlace()`);
    await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.inviteAuthor()`);

    const after = await snapshot();
    expect(after.following).toBe(true);
    expect(after.applied.isFollowing).toBe(true);
    expect(after.saved).toBe(true);
    expect(after.applied.savedByMe).toBe(true);
    expect(after.savedIds).toContain("cafe-central");
    expect(after.savedKey).toBe("connexy:demo:saved-details");
    expect(after.connectStatus).toBe("pending");
    expect(after.catalogNotificationIds).toEqual([]);

    await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.asIdentity("beatriz")`);
    const asB = await snapshot();
    expect(asB.inbox.some((item) => item.kind === "conversation_invite")).toBe(true);
    await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.acceptAuthor()`);

    await reload();
    await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.asIdentity("lucas")`);
    const reloaded = await snapshot();
    expect(reloaded.following).toBe(true);
    expect(reloaded.saved).toBe(true);
    expect(reloaded.savedIds).toContain("cafe-central");
    expect(reloaded.connectStatus).toBe("connected");
    expect(reloaded.connected).toBe(true);
    expect(reloaded.parallelKeys.follows).toBeNull();
    expect(reloaded.networkCalls).toBe(0);

    expect(await evaluate(cdp, sessionId, `window.__connexyMvp1f7Harness.follow()`)).toBe(false);
    await reload();
    expect((await snapshot()).following).toBe(false);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
