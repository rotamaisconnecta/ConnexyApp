import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  session: {
    conversationId: string;
    callerId: string;
    calleeId: string;
    media: string;
    status: string;
  } | null;
  connections: Array<{
    conversationId: string;
    peerId: string | null;
    userAId: string;
    userBId: string;
  }>;
  messages: Array<{
    conversationId: string;
    senderId?: string;
    text: string;
  }>;
  demoKeys: string[];
  storageKeys: string[];
  parallelKeys: { calls: string | null; callStore: string | null };
  databases: Array<string | undefined>;
  networkCalls: number;
};

test("Fase 1F-10 — chamadas demo persistem histórico na conversa sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-10-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-10-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-10 Chat call</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-10-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f10Harness.snapshot()");
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

    const initial = await action<Snapshot>("window.__connexyMvp1f10Harness.reset()");
    expect(initial.session).toBeNull();
    expect(initial.networkCalls).toBe(0);

    const connection = await action<{ conversationId: string }>(
      'window.__connexyMvp1f10Harness.connectPeer("beatriz")',
    );
    await action(
      `window.__connexyMvp1f10Harness.sendMessage(${JSON.stringify(connection.conversationId)}, "Mensagem funcional 1F-10")`,
    );

    const voiceOutgoing = await action<{
      conversationId: string;
      callerId: string;
      calleeId: string;
      media: string;
      status: string;
    }>(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "voice")`,
    );
    expect(voiceOutgoing).toMatchObject({
      conversationId: connection.conversationId,
      callerId: "lucas",
      calleeId: "beatriz",
      media: "voice",
      status: "outgoing",
    });
    await action("window.__connexyMvp1f10Harness.accept()");
    const voiceEnded = await action<{ record: { text: string; senderId?: string } }>(
      "window.__connexyMvp1f10Harness.hangup()",
    );
    expect(voiceEnded.record.text).toBe("Ligação de voz (demo) · encerrada");
    expect(voiceEnded.record.senderId).toBe("lucas");

    await action(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "voice")`,
    );
    const voiceDeclined = await action<{ record: { text: string } }>(
      "window.__connexyMvp1f10Harness.decline()",
    );
    expect(voiceDeclined.record.text).toBe("Ligação de voz (demo) · recusada");

    await action(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "voice")`,
    );
    const voiceMissed = await action<{ record: { text: string } }>(
      "window.__connexyMvp1f10Harness.miss()",
    );
    expect(voiceMissed.record.text).toBe("Ligação de voz (demo) · perdida");

    await action(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "video")`,
    );
    await action("window.__connexyMvp1f10Harness.accept()");
    const videoEnded = await action<{ record: { text: string } }>(
      "window.__connexyMvp1f10Harness.hangup()",
    );
    expect(videoEnded.record.text).toBe("Videochamada (demo) · encerrada");

    await action(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "video")`,
    );
    const videoDeclined = await action<{ record: { text: string } }>(
      "window.__connexyMvp1f10Harness.decline()",
    );
    expect(videoDeclined.record.text).toBe("Videochamada (demo) · recusada");

    await action(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "video")`,
    );
    const videoMissed = await action<{ record: { text: string } }>(
      "window.__connexyMvp1f10Harness.miss()",
    );
    expect(videoMissed.record.text).toBe("Videochamada (demo) · perdida");

    const beforeReload = await snapshot();
    expect(beforeReload.session).toBeNull();
    expect(beforeReload.messages.map((message) => message.text)).toEqual([
      "Mensagem funcional 1F-10",
      "Ligação de voz (demo) · encerrada",
      "Ligação de voz (demo) · recusada",
      "Ligação de voz (demo) · perdida",
      "Videochamada (demo) · encerrada",
      "Videochamada (demo) · recusada",
      "Videochamada (demo) · perdida",
    ]);
    expect(
      beforeReload.messages.every(
        (message) => message.conversationId === connection.conversationId,
      ),
    ).toBe(true);
    expect(beforeReload.parallelKeys).toEqual({ calls: null, callStore: null });
    expect(beforeReload.networkCalls).toBe(0);

    await action(
      `window.__connexyMvp1f10Harness.start(${JSON.stringify(connection.conversationId)}, "beatriz", "voice")`,
    );
    const live = await snapshot();
    expect(live.session?.status).toBe("outgoing");
    expect(live.session?.callerId).toBe("lucas");
    expect(live.session?.calleeId).toBe("beatriz");

    await reload();
    const reloaded = await snapshot();
    expect(reloaded.identity.id).toBe("lucas");
    expect(reloaded.session).toBeNull();
    expect(reloaded.messages.map((message) => message.text)).toEqual(
      beforeReload.messages.map((message) => message.text),
    );
    expect(reloaded.connections[0]?.peerId).toBe("beatriz");
    expect(reloaded.databases).toContain("connexy-app-local-db");
    expect(reloaded.parallelKeys).toEqual({ calls: null, callStore: null });
    expect(reloaded.storageKeys).not.toContain("connexy:demo:calls");
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
