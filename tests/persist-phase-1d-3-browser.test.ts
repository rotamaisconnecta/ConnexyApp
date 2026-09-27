import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type ReelsSnapshot = {
  identity: { id: string };
  reels: Array<{ id: string; author: { id: string }; createdAt: string }>;
  feedIds: string[];
  demoIds: string[];
  likes: Array<{ id: string; reelId: string; userId: string }>;
  comments: Array<{
    id: string;
    reelId: string;
    parentId: string | null;
    siblingOrder: number;
    authorId: string;
    createdAt: string;
  }>;
  tree: Array<{ id: string; replies: Array<{ id: string }> }>;
  interaction: { likedByMe: boolean; likeCount: number; commentCount: number };
  legacy: { published: string; likes: string; comments: string };
  networkCalls: number;
  databases: string[];
};

test("Fase 1D-3 — Reel, Like, Comment e Reply sobrevivem a reload real", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-reels-feed-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/reels-feed-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy Reels 1D-3</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-reels-feed-reload-"));
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
  const reload = async () => {
    const loaded = cdp!.waitForEvent("Page.loadEventFired", sessionId, 15_000);
    await cdp!.send("Page.reload", { ignoreCache: true }, sessionId);
    await loaded;
    await installHarness();
  };
  const snapshot = (reelId: string) =>
    evaluate<ReelsSnapshot>(
      cdp!,
      sessionId,
      `window.__connexyReelsFeedHarness.snapshot(${JSON.stringify(reelId)})`,
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

    const legacy = await evaluate<ReelsSnapshot["legacy"]>(
      cdp,
      sessionId,
      "window.__connexyReelsFeedHarness.reset()",
    );
    const published = await evaluate<{
      reel: { id: string; author: { id: string } };
      persistence: string;
    }>(cdp, sessionId, "window.__connexyReelsFeedHarness.publish()");
    const reelId = published.reel.id;
    expect(published.persistence).toBe("local");
    expect(published.reel.author.id).toBe("lucas");

    const afterPublish = await snapshot(reelId);
    expect(afterPublish.reels).toHaveLength(1);
    expect(afterPublish.feedIds[0]).toBe(reelId);
    expect(afterPublish.feedIds.filter((id) => id === reelId)).toHaveLength(1);
    expect(afterPublish.demoIds.length).toBeGreaterThan(0);
    expect(afterPublish.legacy).toEqual(legacy);
    expect(afterPublish.networkCalls).toBe(0);

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.like(${JSON.stringify(reelId)})`,
    );
    await reload();
    const likedAfterReload = await snapshot(reelId);
    expect(likedAfterReload.interaction).toMatchObject({ likedByMe: true, likeCount: 1 });
    expect(likedAfterReload.likes).toHaveLength(1);
    expect(likedAfterReload.likes[0]).toMatchObject({ reelId, userId: "lucas" });

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.like(${JSON.stringify(reelId)})`,
    );
    expect((await snapshot(reelId)).interaction).toMatchObject({
      likedByMe: false,
      likeCount: 0,
    });
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.like(${JSON.stringify(reelId)})`,
    );

    const rootCreatedAt = "2026-09-17T01:00:00.000Z";
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.comment(${JSON.stringify(reelId)}, "Comentário persistido", "comment-1d-3", ${JSON.stringify(rootCreatedAt)})`,
    );
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.comment(${JSON.stringify(reelId)}, "Comentário persistido", "comment-1d-3", ${JSON.stringify(rootCreatedAt)})`,
    );
    await reload();
    const commentAfterReload = await snapshot(reelId);
    expect(commentAfterReload.comments).toHaveLength(1);
    expect(commentAfterReload.comments[0]).toMatchObject({
      id: "comment-1d-3",
      reelId,
      parentId: null,
      siblingOrder: 0,
      authorId: "lucas",
      createdAt: rootCreatedAt,
    });

    await evaluate(cdp, sessionId, `window.__connexyReelsFeedHarness.asIdentity("beatriz")`);
    const replyCreatedAt = "2026-09-17T01:01:00.000Z";
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.reply(${JSON.stringify(reelId)}, "comment-1d-3", "Resposta persistida", "reply-1d-3", ${JSON.stringify(replyCreatedAt)})`,
    );
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.reply(${JSON.stringify(reelId)}, "comment-1d-3", "Resposta persistida", "reply-1d-3", ${JSON.stringify(replyCreatedAt)})`,
    );
    await reload();

    const finalSnapshot = await snapshot(reelId);
    expect(finalSnapshot.identity.id).toBe("beatriz");
    expect(finalSnapshot.reels).toHaveLength(1);
    expect(finalSnapshot.feedIds.filter((id) => id === reelId)).toHaveLength(1);
    expect(finalSnapshot.likes).toHaveLength(1);
    expect(finalSnapshot.comments).toHaveLength(2);
    expect(finalSnapshot.comments.find((comment) => comment.id === "reply-1d-3")).toMatchObject({
      reelId,
      parentId: "comment-1d-3",
      siblingOrder: 0,
      authorId: "beatriz",
      createdAt: replyCreatedAt,
    });
    expect(finalSnapshot.tree).toHaveLength(1);
    expect(finalSnapshot.tree[0].id).toBe("comment-1d-3");
    expect(finalSnapshot.tree[0].replies.map((reply) => reply.id)).toEqual(["reply-1d-3"]);
    expect(finalSnapshot.interaction.commentCount).toBe(2);
    expect(finalSnapshot.legacy).toEqual(legacy);
    expect(finalSnapshot.networkCalls).toBe(0);
    expect(finalSnapshot.databases).toContain("connexy-reels-data-local-db");
    expect(finalSnapshot.databases).toContain("connexy-reels-local-db");

    const isolated = await evaluate<{
      reels: Array<{ id: string }>;
      feedIds: string[];
      comments: Array<{ id: string; replies: Array<{ id: string }> }>;
      interaction: { likedByMe: boolean; likeCount: number; commentCount: number };
    }>(
      cdp,
      sessionId,
      `window.__connexyReelsFeedHarness.readWithoutLegacy(${JSON.stringify(reelId)})`,
    );
    expect(isolated.reels.map((reel) => reel.id)).toEqual([reelId]);
    expect(isolated.feedIds).toContain(reelId);
    expect(isolated.comments[0].replies[0].id).toBe("reply-1d-3");
    expect(isolated.interaction).toEqual({ likedByMe: true, likeCount: 1, commentCount: 2 });

    await reload();
    const idempotentReload = await snapshot(reelId);
    expect(idempotentReload.reels).toEqual(finalSnapshot.reels);
    expect(idempotentReload.likes).toEqual(finalSnapshot.likes);
    expect(idempotentReload.comments).toEqual(finalSnapshot.comments);
    expect(idempotentReload.tree).toEqual(finalSnapshot.tree);
    expect(idempotentReload.legacy).toEqual(legacy);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 60_000);
