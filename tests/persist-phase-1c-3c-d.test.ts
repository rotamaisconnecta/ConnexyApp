import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type JsonObject = Record<string, unknown>;

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { resolve(value: JsonObject): void; reject(error: Error): void }
  >();
  private readonly eventWaiters = new Map<string, Array<(params: JsonObject) => void>>();

  private constructor(private readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as {
        id?: number;
        method?: string;
        sessionId?: string;
        params?: JsonObject;
        result?: JsonObject;
        error?: { message?: string };
      };
      if (message.id) {
        const waiter = this.pending.get(message.id);
        if (!waiter) return;
        this.pending.delete(message.id);
        if (message.error) waiter.reject(new Error(message.error.message ?? "CDP error"));
        else waiter.resolve(message.result ?? {});
        return;
      }
      if (!message.method) return;
      const key = `${message.sessionId ?? ""}:${message.method}`;
      const waiters = this.eventWaiters.get(key) ?? [];
      this.eventWaiters.delete(key);
      for (const waiter of waiters) waiter(message.params ?? {});
    });
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("Falha no WebSocket CDP")), {
        once: true,
      });
    });
    return new CdpClient(socket);
  }

  send(method: string, params: JsonObject = {}, sessionId?: string): Promise<JsonObject> {
    const id = this.nextId++;
    const response = new Promise<JsonObject>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return response;
  }

  waitForEvent(method: string, sessionId: string, timeoutMs = 10_000): Promise<JsonObject> {
    const key = `${sessionId}:${method}`;
    return new Promise<JsonObject>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout esperando ${method}`)), timeoutMs);
      const waiters = this.eventWaiters.get(key) ?? [];
      waiters.push((params) => {
        clearTimeout(timeout);
        resolve(params);
      });
      this.eventWaiters.set(key, waiters);
    });
  }

  close(): void {
    this.socket.close();
  }
}

async function devtoolsUrl(
  stream: ReadableStream<Uint8Array>,
  timeoutMs = 10_000,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  const timeout = setTimeout(() => void reader.cancel(), timeoutMs);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      output += decoder.decode(value, { stream: true });
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) return match[1];
    }
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
  throw new Error(`Chrome não publicou endpoint CDP: ${output}`);
}

function chromeBinary(): string {
  const configured = process.env.CHROME_PATH;
  const candidates = [
    configured,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));
  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) throw new Error("Chrome/Chromium necessário para validar IndexedDB real");
  return executable;
}

async function evaluate<T>(cdp: CdpClient, sessionId: string, expression: string): Promise<T> {
  const response = (await cdp.send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  )) as {
    result?: { value?: T; description?: string };
    exceptionDetails?: { text?: string };
  };
  if (response.exceptionDetails) {
    throw new Error(
      `${response.result?.description ?? response.exceptionDetails.text ?? "Erro no browser"}: ${JSON.stringify(response.exceptionDetails)}`,
    );
  }
  return response.result?.value as T;
}

test("Fase 1C-3C-D — IndexedDB real preserva A → B → C em três reloads", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-reload-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/reels-reload-browser.ts"),
      "--target=browser",
      "--format=iife",
      `--outfile=${bundlePath}`,
      "--tsconfig-override=tsconfig.json",
    ],
    { cwd: projectRoot, stdout: "pipe", stderr: "pipe" },
  );
  expect(bundle.exitCode).toBe(0);
  const browserScript = await readFile(bundlePath, "utf8");
  const server = Bun.serve({
    port: 0,
    fetch: () =>
      new Response("<!doctype html><html><body>Connexy reload test</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const profile = await mkdtemp(join(tmpdir(), "connexy-reload-"));
  const chrome = Bun.spawn(
    [
      chromeBinary(),
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-background-networking",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  let cdp: CdpClient | null = null;
  let sessionId = "";
  const pageUrl = String(server.url);
  const installHarness = () => evaluate(cdp!, sessionId, browserScript);
  const reload = async () => {
    const loaded = cdp!.waitForEvent("Page.loadEventFired", sessionId);
    await cdp!.send("Page.reload", { ignoreCache: true }, sessionId);
    await loaded;
    await installHarness();
  };

  const reel = (id: string, createdAt: string) => ({
    id,
    caption: id,
    category: "MOMENT",
    author: {
      id: `author-${id}`,
      name: `Autor ${id}`,
      handle: id,
      photoUrl: `${id}.jpg`,
      verified: false,
      profession: null,
      isFollowing: false,
    },
    context: null,
    durationS: 15,
    createdAt,
    persistence: "local",
  });
  const comment = (
    id: string,
    createdAt: string,
    replies: unknown[] = [],
    siblingOrder?: number,
  ) => ({
    id,
    text: `texto ${id}`,
    authorId: `author-${id}`,
    authorName: `Autor ${id}`,
    authorPhoto: `${id}.jpg`,
    createdAt,
    likes: id.length,
    likedByMe: id === "reply-e",
    replies,
    ...(siblingOrder === undefined ? {} : { siblingOrder }),
  });
  const sources = {
    published: JSON.stringify({
      version: 1,
      items: [
        reel("reel-local-1", "2026-09-10T10:00:00.000Z"),
        reel("reel-local-2", "2026-09-11T10:00:00.000Z"),
      ],
    }),
    likes: JSON.stringify({ "reel-local-1": true, "reel-local-2": true }),
    comments: JSON.stringify({
      "reel-local-1": [
        comment("comment-a", "2026-09-10T11:00:00.000Z", [
          comment(
            "reply-b",
            "2026-09-10T11:01:00.000Z",
            [
              comment(
                "reply-c",
                "2026-09-10T11:02:00.000Z",
                [comment("reply-d", "2026-09-10T11:03:00.000Z", [], 0)],
                0,
              ),
            ],
            0,
          ),
          comment("reply-e", "2026-09-10T11:04:00.000Z", [], 1),
        ]),
        comment("comment-x", "2026-09-10T12:00:00.000Z"),
      ],
      "reel-local-2": [
        comment("comment-y", "2026-09-11T11:00:00.000Z", [
          comment("reply-z", "2026-09-11T11:01:00.000Z"),
        ]),
      ],
    }),
  };

  try {
    const endpoint = await devtoolsUrl(chrome.stderr);
    cdp = await CdpClient.connect(endpoint);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    const attached = await cdp.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: true,
    });
    sessionId = String(attached.sessionId);
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    const initialLoad = cdp.waitForEvent("Page.loadEventFired", sessionId);
    await cdp.send("Page.navigate", { url: pageUrl }, sessionId);
    await initialLoad;
    await installHarness();

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyReloadHarness.reset(${JSON.stringify(sources)})`,
    );
    const firstMigration = await evaluate<{
      reelResult: { completed: boolean };
      likeResult: { completed: boolean };
      commentResult: { completed: boolean };
    }>(cdp, sessionId, `window.__connexyReloadHarness.runMigrations("active-user")`);
    expect(firstMigration.reelResult.completed).toBe(true);
    expect(firstMigration.likeResult.completed).toBe(true);
    expect(firstMigration.commentResult.completed).toBe(true);

    await reload();
    const afterFirstReload = await evaluate<JsonObject>(
      cdp,
      sessionId,
      "window.__connexyReloadHarness.snapshot()",
    );
    expect((afterFirstReload.reels as unknown[]).length).toBe(2);
    expect((afterFirstReload.likes as unknown[]).length).toBe(2);
    expect((afterFirstReload.comments as unknown[]).length).toBe(8);
    expect(afterFirstReload.replyCount).toBe(5);
    expect(afterFirstReload.maxDepth).toBe(4);

    const secondMigration = await evaluate<{
      reelResult: { migrated: number };
      likeResult: { migrated: number };
      commentResult: { migrated: number };
    }>(cdp, sessionId, `window.__connexyReloadHarness.runMigrations("active-user")`);
    expect(secondMigration.reelResult.migrated).toBe(0);
    expect(secondMigration.likeResult.migrated).toBe(0);
    expect(secondMigration.commentResult.migrated).toBe(0);

    await reload();
    const afterSecondReload = await evaluate<JsonObject>(
      cdp,
      sessionId,
      "window.__connexyReloadHarness.snapshot()",
    );
    await reload();
    const afterThirdReload = await evaluate<JsonObject>(
      cdp,
      sessionId,
      "window.__connexyReloadHarness.snapshot()",
    );
    expect(afterSecondReload).toEqual(afterFirstReload);
    expect(afterThirdReload).toEqual(afterFirstReload);

    const comments = afterThirdReload.comments as Array<{
      id: string;
      parentId?: string | null;
      siblingOrder?: number | null;
      authorId: string;
      createdAt: string;
      likes: number;
      likedByMe: boolean;
    }>;
    const byId = new Map(comments.map((item) => [item.id, item]));
    expect(byId.get("reply-b")?.parentId).toBe("comment-a");
    expect(byId.get("reply-c")?.parentId).toBe("reply-b");
    expect(byId.get("reply-d")?.parentId).toBe("reply-c");
    expect(byId.get("reply-e")?.siblingOrder).toBe(1);
    expect(byId.get("reply-e")?.authorId).toBe("author-reply-e");
    expect(byId.get("reply-e")?.createdAt).toBe("2026-09-10T11:04:00.000Z");
    expect(byId.get("reply-e")?.likes).toBe(7);
    expect(byId.get("reply-e")?.likedByMe).toBe(true);
    expect((afterThirdReload.repliesA as Array<{ id: string }>).map((item) => item.id)).toEqual([
      "reply-b",
      "reply-e",
    ]);

    expect(afterThirdReload.sources).toEqual({
      published: sources.published,
      likes: sources.likes,
      comments: sources.comments,
    });
    const marker = JSON.parse(String(afterThirdReload.marker)) as {
      stages: Record<string, string>;
    };
    expect(marker.stages).toEqual({
      reels: "completed",
      likes: "completed",
      comments: "completed",
    });

    const persistedOnly = await evaluate<Array<{ id: string }>>(
      cdp,
      sessionId,
      "window.__connexyReloadHarness.readWithoutLocalStorage()",
    );
    expect(persistedOnly.map((item) => item.id).sort()).toEqual(["reel-local-1", "reel-local-2"]);

    for (const stages of [
      { reels: "completed", likes: "completed", comments: "pending" },
      { reels: "completed", likes: "pending", comments: "pending" },
    ]) {
      const raw = JSON.stringify({
        version: 1,
        ranAt: "2026-09-12T00:00:00.000Z",
        counts: { reels: 2, likes: stages.likes === "completed" ? 2 : 0, comments: 0 },
        stages,
      });
      await evaluate(
        cdp,
        sessionId,
        `window.__connexyReloadHarness.setMarker(${JSON.stringify(raw)})`,
      );
      await reload();
      expect(
        await evaluate<string>(cdp, sessionId, "window.__connexyReloadHarness.getMarker()"),
      ).toBe(raw);
    }
  } finally {
    if (cdp && sessionId) {
      await evaluate(cdp, sessionId, "window.__connexyReloadHarness.cleanup()").catch(
        () => undefined,
      );
    }
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(profile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
