import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  moreMenu: string[];
  agoraRoute: string | null;
  feedIds: string[];
  persistedIds: string[];
  catalogId: string;
  following: boolean;
  saved: boolean;
  savedIds: string[];
  connectStatus: string;
  connected: boolean;
  applied: { savedByMe: boolean; isFollowing: boolean };
  published: {
    interaction: { likedByMe: boolean; likeCount: number; commentCount: number } | null;
    comments: Array<{ id: string }>;
  };
  databases: Array<string | undefined>;
  networkCalls: number;
};

test("Fase 1G-3 — Agora usa a infraestrutura existente de Reels sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1g-3-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1g-3-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1G-3 Agora</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1g-3-reload-"));
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
  const snapshot = (publishedId: string | null = null) =>
    evaluate<Snapshot>(
      cdp!,
      sessionId,
      `window.__connexyMvp1g3Harness.snapshot(${JSON.stringify(publishedId)})`,
    );

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
      "window.__connexyMvp1g3Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.moreMenu).toEqual([
      "Locais",
      "Eventos",
      "Negócios",
      "Agora",
      "Ofertas",
      "Gerenciar",
    ]);
    expect(initial.agoraRoute).toBe("/reels");
    expect(initial.feedIds.length).toBeGreaterThan(0);
    expect(initial.following).toBe(false);
    expect(initial.saved).toBe(false);
    expect(initial.connectStatus).toBe("available");
    expect(initial.networkCalls).toBe(0);

    const published = await evaluate<{ reel: { id: string }; persistence: string }>(
      cdp,
      sessionId,
      "window.__connexyMvp1g3Harness.publish()",
    );
    expect(published.persistence).toBe("local");
    const reelId = published.reel.id;

    await evaluate(cdp, sessionId, `window.__connexyMvp1g3Harness.like(${JSON.stringify(reelId)})`);
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1g3Harness.comment(${JSON.stringify(reelId)}, "Comentário 1G-3", "comment-1g-3", "2026-09-20T03:00:00.000Z")`,
    );
    expect(await evaluate(cdp, sessionId, "window.__connexyMvp1g3Harness.follow()")).toBe(true);
    expect(await evaluate(cdp, sessionId, "window.__connexyMvp1g3Harness.save()")).toBe(true);
    await evaluate(cdp, sessionId, "window.__connexyMvp1g3Harness.inviteAuthor()");
    await evaluate(cdp, sessionId, `window.__connexyMvp1g3Harness.asIdentity("beatriz")`);
    await evaluate(cdp, sessionId, "window.__connexyMvp1g3Harness.acceptAuthor()");
    await evaluate(cdp, sessionId, `window.__connexyMvp1g3Harness.asIdentity("lucas")`);

    await reload();
    const reloaded = await snapshot(reelId);
    expect(reloaded.moreMenu).toEqual(initial.moreMenu);
    expect(reloaded.agoraRoute).toBe("/reels");
    expect(reloaded.feedIds).toContain(reelId);
    expect(reloaded.persistedIds).toEqual([reelId]);
    expect(reloaded.published.interaction).toMatchObject({
      likedByMe: true,
      likeCount: 1,
      commentCount: 1,
    });
    expect(reloaded.published.comments.map((comment) => comment.id)).toEqual(["comment-1g-3"]);
    expect(reloaded.following).toBe(true);
    expect(reloaded.applied.isFollowing).toBe(true);
    expect(reloaded.saved).toBe(true);
    expect(reloaded.applied.savedByMe).toBe(true);
    expect(reloaded.connectStatus).toBe("connected");
    expect(reloaded.connected).toBe(true);
    expect(reloaded.databases).toContain("connexy-reels-data-local-db");
    expect(reloaded.databases).toContain("connexy-reels-local-db");
    expect(reloaded.databases).not.toContain("connexy-agora-data-local-db");
    expect(reloaded.networkCalls).toBe(0);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 60_000);
