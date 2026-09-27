import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type Snapshot = {
  identity: { id: string };
  incoming: Array<{ id: string; fromUserId: string; toUserId: string }>;
  inbox: Array<{ kind: string; requestId?: string; groupId?: string; name?: string }>;
  connections: Array<{ conversationId: string; peerId: string }>;
  conversations: Array<{ id: string; lastMessage: string; participant: { id: string } }>;
  messages: Array<{ text: string; conversationId: string }>;
  mockIdsInFunctionalList: string[];
  filter: {
    beatrizOnlineNearby: boolean;
    carlosOnline: boolean;
    marinaNearby: boolean;
  };
  catalogNotificationIds: string[];
  parallelInviteSource: string | null;
  networkCalls: number;
};

test("Fase 1F-5 — Connecta, conversas e inbox usam fontes reais sem rede", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-1f-5-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/mvp-1f-5-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy 1F-5 Social residual</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-1f-5-reload-"));
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
    evaluate<Snapshot>(cdp!, sessionId, "window.__connexyMvp1f5Harness.snapshot()");

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
      "window.__connexyMvp1f5Harness.reset()",
    );
    expect(initial.identity.id).toBe("lucas");
    expect(initial.incoming).toEqual([]);
    expect(initial.inbox).toEqual([]);
    expect(initial.conversations).toEqual([]);
    expect(initial.mockIdsInFunctionalList).toEqual([]);
    expect(initial.catalogNotificationIds).toEqual([]);
    expect(initial.filter.beatrizOnlineNearby).toBe(true);
    expect(initial.filter.carlosOnline).toBe(false);
    expect(initial.filter.marinaNearby).toBe(false);
    expect(initial.networkCalls).toBe(0);

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f5Harness.invite("beatriz", "lucas", "Oi, Lucas!")`,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1f5Harness.asIdentity("lucas")`);
    const pending = await snapshot();
    expect(pending.incoming).toHaveLength(1);
    expect(pending.incoming[0]).toMatchObject({ fromUserId: "beatriz", toUserId: "lucas" });
    expect(pending.inbox).toHaveLength(1);
    expect(pending.inbox[0]?.kind).toBe("conversation_invite");
    expect(pending.conversations).toEqual([]);
    expect(pending.mockIdsInFunctionalList).toEqual([]);
    expect(pending.catalogNotificationIds).toEqual([]);
    expect(pending.networkCalls).toBe(0);

    await reload();
    const pendingReloaded = await snapshot();
    expect(pendingReloaded.incoming).toHaveLength(1);
    expect(pendingReloaded.inbox).toHaveLength(1);

    const accepted = await evaluate<{ conversationId: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1f5Harness.accept("beatriz")`,
    );
    const afterAccept = await snapshot();
    expect(afterAccept.incoming).toEqual([]);
    expect(afterAccept.inbox).toEqual([]);
    expect(afterAccept.conversations).toHaveLength(1);
    expect(afterAccept.conversations[0]?.id).toBe(accepted.conversationId);
    expect(afterAccept.conversations[0]?.participant.id).toBe("beatriz");
    expect(afterAccept.mockIdsInFunctionalList).toEqual([]);

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f5Harness.sendMessage(${JSON.stringify(accepted.conversationId)}, "Mensagem 1F-5")`,
    );
    await reload();
    const withMessage = await snapshot();
    expect(withMessage.conversations).toHaveLength(1);
    expect(withMessage.conversations[0]?.lastMessage).toBe("Mensagem 1F-5");
    expect(withMessage.messages.map((message) => message.text)).toContain("Mensagem 1F-5");
    expect(withMessage.mockIdsInFunctionalList).toEqual([]);

    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f5Harness.invite("rafael", "lucas", "Convite a recusar")`,
    );
    const beforeDecline = await snapshot();
    expect(beforeDecline.incoming).toHaveLength(1);
    expect(beforeDecline.inbox.filter((item) => item.kind === "conversation_invite")).toHaveLength(
      1,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1f5Harness.decline("rafael")`);
    expect((await snapshot()).incoming).toEqual([]);

    const group = await evaluate<{ id: string }>(
      cdp,
      sessionId,
      `window.__connexyMvp1f5Harness.createGroup(${JSON.stringify(accepted.conversationId)}, "beatriz", "Grupo 1F-5")`,
    );
    await evaluate(cdp, sessionId, `window.__connexyMvp1f5Harness.asIdentity("beatriz")`);
    const groupInbox = await snapshot();
    expect(groupInbox.inbox.filter((item) => item.kind === "group_invite")).toHaveLength(1);
    expect(groupInbox.inbox[0]).toMatchObject({ groupId: group.id, name: "Grupo 1F-5" });
    await evaluate(
      cdp,
      sessionId,
      `window.__connexyMvp1f5Harness.respondGroup(${JSON.stringify(group.id)}, true)`,
    );
    await reload();
    const afterGroup = await snapshot();
    expect(afterGroup.inbox.filter((item) => item.kind === "group_invite")).toEqual([]);
    expect(afterGroup.conversations.some((item) => item.id === group.id)).toBe(true);
    expect(afterGroup.catalogNotificationIds).toEqual([]);
    expect(afterGroup.parallelInviteSource).toBeNull();
    expect(afterGroup.networkCalls).toBe(0);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
