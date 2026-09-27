import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CdpClient, chromeBinary, devtoolsUrl, evaluate } from "./helpers/cdp-browser";

type ProfileSnapshot = {
  authenticated: boolean;
  signupPending: boolean;
  identity: { id: string };
  canonical: {
    identityId: string;
    profile: {
      identityId?: string;
      name: string;
      handle: string;
      bio: string;
      photo: string;
      birthDate?: string;
      age?: number | null;
      interests: string[];
    };
  };
  profileKeys: string[];
  demoKeys: string[];
};

test("Fase 1D-1 — onboarding e edição sobrevivem a reload real", async () => {
  const projectRoot = join(import.meta.dir, "..");
  const bundleDirectory = await mkdtemp(join(tmpdir(), "connexy-profile-bundle-"));
  const bundlePath = join(bundleDirectory, "harness.js");
  const bundle = Bun.spawnSync(
    [
      process.execPath,
      "build",
      join(import.meta.dir, "fixtures/profile-onboarding-browser.ts"),
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
      new Response("<!doctype html><html><body>Connexy profile reload test</body></html>", {
        headers: { "content-type": "text/html" },
      }),
  });
  const browserProfile = await mkdtemp(join(tmpdir(), "connexy-profile-reload-"));
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

    await evaluate(cdp, sessionId, "window.__connexyProfileHarness.reset()");
    const started = await evaluate<ProfileSnapshot>(
      cdp,
      sessionId,
      "window.__connexyProfileHarness.start()",
    );
    expect(started.authenticated).toBe(true);
    expect(started.signupPending).toBe(true);
    expect(started.profileKeys).toEqual([]);
    const identityId = started.identity.id;

    await evaluate(cdp, sessionId, "window.__connexyProfileHarness.saveProfile()");
    await reload();
    const afterProfileReload = await evaluate<ProfileSnapshot>(
      cdp,
      sessionId,
      "window.__connexyProfileHarness.snapshot()",
    );
    expect(afterProfileReload.signupPending).toBe(true);
    expect(afterProfileReload.identity.id).toBe(identityId);
    expect(afterProfileReload.canonical.profile.name).toBe("Ana Costa");
    expect(afterProfileReload.canonical.profile.handle).toBe("anacosta");
    expect(afterProfileReload.canonical.profile.bio).toBe("Design e cafés de bairro");
    expect(afterProfileReload.canonical.profile.birthDate).toBe("1994-03-20");
    expect(afterProfileReload.canonical.profile.age).toBeGreaterThan(0);
    expect(afterProfileReload.canonical.profile.photo.startsWith("data:image/jpeg")).toBe(true);

    await evaluate(cdp, sessionId, "window.__connexyProfileHarness.saveInterests()");
    await reload();
    const completed = await evaluate<ProfileSnapshot>(
      cdp,
      sessionId,
      "window.__connexyProfileHarness.snapshot()",
    );
    expect(completed.authenticated).toBe(true);
    expect(completed.signupPending).toBe(false);
    expect(completed.identity.id).toBe(identityId);
    expect(completed.canonical.identityId).toBe(identityId);
    expect(completed.canonical.profile.identityId).toBe(identityId);
    expect(completed.canonical.profile.interests).toEqual(["Café", "Arte", "Cinema"]);
    expect(new Set(completed.canonical.profile.interests).size).toBe(3);
    expect(completed.profileKeys).toEqual(["connexy:demo:own-profile"]);
    expect(completed.demoKeys).toEqual(["connexy:demo:authenticated", "connexy:demo:own-profile"]);

    await evaluate(cdp, sessionId, "window.__connexyProfileHarness.editProfile()");
    await reload();
    const edited = await evaluate<ProfileSnapshot>(
      cdp,
      sessionId,
      "window.__connexyProfileHarness.snapshot()",
    );
    expect(edited.canonical.profile.name).toBe("Ana Costa Silva");
    expect(edited.canonical.profile.bio).toBe("Bio editada após onboarding");
    expect(edited.canonical.profile.interests).toEqual(["Café", "Arte", "Cinema"]);
    expect(edited.canonical.profile.identityId).toBe(identityId);
  } finally {
    cdp?.close();
    chrome.kill();
    await chrome.exited.catch(() => undefined);
    server.stop(true);
    await rm(browserProfile, { recursive: true, force: true });
    await rm(bundleDirectory, { recursive: true, force: true });
  }
}, 30_000);
