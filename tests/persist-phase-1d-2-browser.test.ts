import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type SocialSnapshot = {
  identity: { id: string };
  incoming: Array<{ id: string; fromUserId: string; toUserId: string }>;
  connections: Array<{
    userAId: string;
    userBId: string;
    conversationId: string;
    peerId: string;
  }>;
  conversations: Array<{
    id: string;
    lastMessageText: string | null;
    updatedAt: number;
  }>;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId?: string;
    text: string;
  }>;
  demoKeys: string[];
  parallelInviteSource: string | null;
  databases: Array<string | undefined>;
};

test("Fase 1D-2 — convite, conexão e mensagem sobrevivem a reload real", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-social-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/social-conversation-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy social reload test</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-social-reload-"));
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
    evaluate<SocialSnapshot>(cdp!, sessionId, "window.__connexySocialHarness.snapshot()");

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

    const initial = await evaluate<SocialSnapshot>(
      cdp,
      sessionId,
      "window.__connexySocialHarness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.incoming).toEqual([]);
    expect(initial.connections).toEqual([]);
    expect(initial.conversations).toEqual([]);
    expect(initial.messages).toEqual([]);

    const firstInvite = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexySocialHarness.invite("beatriz", "Oi, Beatriz!")`,
    );
    const duplicateInvite = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexySocialHarness.invite("beatriz", "Oi novamente, Beatriz!")`,
    );
    expect(duplicateInvite.id).toBe(firstInvite.id);

    await reload();
    await evaluate(cdp, sessionId, `window.__connexySocialHarness.asIdentity("beatriz")`);
    const recipientAfterReload = await snapshot();
    expect(recipientAfterReload.incoming).toHaveLength(1);
    expect(recipientAfterReload.incoming[0]).toMatchObject({
      fromUserId: "lucas",
      toUserId: "beatriz",
    });

    await evaluate(cdp, sessionId, `window.__connexySocialHarness.asIdentity("rafael")`);
    expect((await snapshot()).incoming).toEqual([]);

    await evaluate(cdp, sessionId, `window.__connexySocialHarness.asIdentity("beatriz")`);
    const accepted = await evaluate<{ conversationId: string }>(
      cdp,
      sessionId,
      `window.__connexySocialHarness.accept("lucas")`,
    );
    const acceptedAgain = await evaluate<{ conversationId: string }>(
      cdp,
      sessionId,
      `window.__connexySocialHarness.accept("lucas")`,
    );
    expect(acceptedAgain.conversationId).toBe(accepted.conversationId);

    const recipientConnected = await snapshot();
    expect(recipientConnected.incoming).toEqual([]);
    expect(recipientConnected.connections).toHaveLength(1);
    expect(recipientConnected.connections[0].peerId).toBe("lucas");
    expect(recipientConnected.conversations).toHaveLength(1);
    expect(recipientConnected.conversations[0].id).toBe(accepted.conversationId);

    await evaluate(cdp, sessionId, `window.__connexySocialHarness.asIdentity("lucas")`);
    const senderConnected = await snapshot();
    expect(senderConnected.connections).toHaveLength(1);
    expect(senderConnected.connections[0].peerId).toBe("beatriz");
    expect(senderConnected.connections[0].conversationId).toBe(accepted.conversationId);

    await evaluate(
      cdp,
      sessionId,
      `window.__connexySocialHarness.sendMessage(${JSON.stringify(accepted.conversationId)}, "Mensagem persistida de A")`,
    );
    await reload();
    const senderReloaded = await snapshot();
    expect(senderReloaded.conversations).toHaveLength(1);
    expect(senderReloaded.conversations[0].lastMessageText).toBe("Mensagem persistida de A");
    expect(senderReloaded.messages).toHaveLength(1);
    expect(senderReloaded.messages[0]).toMatchObject({
      conversationId: accepted.conversationId,
      senderId: "lucas",
      text: "Mensagem persistida de A",
    });

    await evaluate(cdp, sessionId, `window.__connexySocialHarness.asIdentity("beatriz")`);
    const recipientReadsMessage = await snapshot();
    expect(recipientReadsMessage.connections[0].conversationId).toBe(accepted.conversationId);
    expect(recipientReadsMessage.messages[0].senderId).toBe("lucas");

    await evaluate(
      cdp,
      sessionId,
      `window.__connexySocialHarness.sendMessage(${JSON.stringify(accepted.conversationId)}, "Resposta persistida de B")`,
    );
    await reload();
    const finalSnapshot = await evaluate<SocialSnapshot>(
      cdp,
      sessionId,
      "window.__connexySocialHarness.snapshotWithoutNetwork()",
    );
    expect(finalSnapshot.identity.id).toBe("beatriz");
    expect(finalSnapshot.connections).toHaveLength(1);
    expect(finalSnapshot.conversations).toHaveLength(1);
    expect(finalSnapshot.messages.map((message) => message.senderId)).toEqual(["lucas", "beatriz"]);
    expect(finalSnapshot.conversations[0].lastMessageText).toBe("Resposta persistida de B");
    expect(finalSnapshot.parallelInviteSource).toBeNull();
    expect(finalSnapshot.databases).toContain("connexy-app-local-db");
    expect(finalSnapshot.demoKeys).toEqual([
      "connexy:demo:authenticated",
      "connexy:demo:db",
      "connexy:demo:identity",
    ]);

    await reload();
    const idempotentReload = await snapshot();
    expect(idempotentReload.connections).toEqual(finalSnapshot.connections);
    expect(idempotentReload.conversations).toEqual(finalSnapshot.conversations);
    expect(idempotentReload.messages).toEqual(finalSnapshot.messages);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
