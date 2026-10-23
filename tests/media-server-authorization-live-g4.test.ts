import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSchemaAClient, type SchemaAClient } from "../src/integrations/supabase/remote";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import { createServerMediaUrlService } from "../src/lib/media/media-server-authorization.server";
import { setMediaUrlGateForTests } from "../src/lib/media/media-url-flag";
import { isLocalSchemaAReachable, loadLocalSchemaAEnv } from "./helpers/schema-a-remote-local";

/**
 * G4 — testes integrados LOCAIS da autorizacao server-side + assinatura.
 *
 * Exercitam a composicao real (`createServerMediaUrlService`): leitura por RLS
 * com a sessao do usuario, checagem de conexao, autorizacao pela linha e
 * assinatura com a credencial privilegiada server-side. Nunca toca remoto.
 */

const localEnv = await loadLocalSchemaAEnv();
const live = Boolean(localEnv && (await isLocalSchemaAReachable(localEnv)));

let admin: SupabaseClient | null = null;
const clients: SchemaAClient[] = [];
const createdUserIds: string[] = [];
const stamp = Date.now();
const uploadedPaths: string[] = [];

const BUCKET = "bio-media";

function storagePath(ownerId: string): string {
  return `${ownerId}/media/${crypto.randomUUID()}.jpg`;
}

async function createUser(email: string, password: string) {
  if (!admin || !localEnv) throw new Error("admin client missing");
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error ?? new Error("user create failed");
  const id = created.data.user.id;
  createdUserIds.push(id);
  const client = createSchemaAClient(localEnv.url, localEnv.anonKey);
  const session = await client.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  clients.push(client);
  return { id, client };
}

async function insertPost(
  authorId: string,
  privacy: "PUBLIC" | "CONNECTIONS" | "PRIVATE",
  media: unknown,
): Promise<string> {
  if (!admin) throw new Error("admin missing");
  const { data, error } = await admin
    .from("posts")
    .insert({ author_id: authorId, privacy, text: "g4 synthetic", media })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("post insert failed");
  return data.id as string;
}

async function connect(a: string, b: string) {
  if (!admin) throw new Error("admin missing");
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const { error } = await admin.from("connections").insert({ user_a_id: lo, user_b_id: hi });
  if (error) throw error;
}

async function disconnect(a: string, b: string) {
  if (!admin) throw new Error("admin missing");
  const [lo, hi] = a < b ? [a, b] : [b, a];
  await admin.from("connections").delete().eq("user_a_id", lo).eq("user_b_id", hi);
}

function serviceFor(
  client: SchemaAClient,
  viewerId: string | null,
  opts: {
    signer?: Parameters<typeof createServerMediaUrlService>[0]["signer"];
    isEnabled?: () => boolean;
  } = {},
) {
  return createServerMediaUrlService({ supabase: client, viewerId, ...opts });
}

describe.skipIf(!live)("G4 — autorização server-side de mídia (local)", () => {
  let a: Awaited<ReturnType<typeof createUser>>;
  let b: Awaited<ReturnType<typeof createUser>>;
  let anon: SchemaAClient;
  let pathA: string;
  const mediaRef = () => [{ type: "image", bucket: BUCKET, path: pathA }];

  beforeAll(async () => {
    if (!live || !localEnv) return;
    // Credencial privilegiada somente server-side via client.server (lazy).
    process.env.SUPABASE_URL = localEnv.url;
    process.env.SUPABASE_SERVICE_ROLE_KEY = localEnv.serviceRoleKey;
    admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    a = await createUser(`g4a-${stamp}@local.test`, "password-a4");
    b = await createUser(`g4b-${stamp}@local.test`, "password-b4");
    anon = createSchemaAClient(localEnv.url, localEnv.anonKey);
    pathA = storagePath(a.id);
    const up = await admin.storage
      .from(BUCKET)
      .upload(pathA, new Blob(["synthetic-g4"], { type: "image/jpeg" }), {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (up.error) throw up.error;
    uploadedPaths.push(pathA);
  });

  afterAll(async () => {
    setRemoteAuthGateForTests(null);
    setMediaUrlGateForTests(null);
    if (admin && uploadedPaths.length > 0) {
      await admin.storage.from(BUCKET).remove(uploadedPaths);
    }
    for (const client of clients) await client.auth.signOut();
    if (admin && createdUserIds.length > 0) {
      await admin.from("posts").delete().in("author_id", createdUserIds);
      await admin
        .from("connections")
        .delete()
        .or(createdUserIds.map((id) => `user_a_id.eq.${id},user_b_id.eq.${id}`).join(","));
      await admin.from("profile_private").delete().in("user_id", createdUserIds);
      await admin.from("profiles").delete().in("id", createdUserIds);
      for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
    }
  });

  test("owner signs own PUBLIC, CONNECTIONS and PRIVATE media with the service-role signer", async () => {
    if (!live) return;
    const pub = await insertPost(a.id, "PUBLIC", mediaRef());
    const conn = await insertPost(a.id, "CONNECTIONS", mediaRef());
    const priv = await insertPost(a.id, "PRIVATE", mediaRef());
    const svc = serviceFor(a.client, a.id, { isEnabled: () => true });
    for (const id of [pub, conn, priv]) {
      const res = await svc.getMediaUrl(id, { kind: "identity", bucket: BUCKET, path: pathA });
      expect(res.status).toBe("ready");
      if (res.status === "ready") expect(res.url).toContain(BUCKET);
    }
  });

  test("anonymous viewer is denied and no signed URL is produced", async () => {
    if (!live) return;
    const pub = await insertPost(a.id, "PUBLIC", mediaRef());
    const svc = serviceFor(anon, null, { isEnabled: () => true });
    expect((await svc.getMediaUrl(pub, { kind: "index", index: 0 })).status).toBe("forbidden");
  });

  test("non-owner is denied on PRIVATE and on CONNECTIONS when disconnected", async () => {
    if (!live) return;
    await disconnect(a.id, b.id);
    const priv = await insertPost(a.id, "PRIVATE", mediaRef());
    const conn = await insertPost(a.id, "CONNECTIONS", mediaRef());
    const svc = serviceFor(b.client, b.id, { isEnabled: () => true });
    expect((await svc.getMediaUrl(priv, { kind: "index", index: 0 })).status).toBe("forbidden");
    expect((await svc.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("forbidden");
  });

  test("connected non-owner is allowed on CONNECTIONS and blocked after disconnect", async () => {
    if (!live) return;
    const conn = await insertPost(a.id, "CONNECTIONS", mediaRef());
    await connect(a.id, b.id);
    const svc = serviceFor(b.client, b.id, { isEnabled: () => true });
    expect((await svc.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("ready");

    await disconnect(a.id, b.id);
    const after = serviceFor(b.client, b.id, { isEnabled: () => true });
    expect((await after.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("forbidden");
  });

  test("arbitrary, other-owner and incompatible-bucket refs are rejected", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", mediaRef());
    const svc = serviceFor(a.client, a.id, { isEnabled: () => true });

    expect(
      (
        await svc.getMediaUrl(post, {
          kind: "identity",
          bucket: BUCKET,
          path: storagePath(a.id),
        })
      ).status,
    ).toBe("missing");

    const foreign = storagePath(b.id);
    const foreignPost = await insertPost(a.id, "PUBLIC", [
      { type: "image", bucket: BUCKET, path: foreign },
    ]);
    expect(
      (await svc.getMediaUrl(foreignPost, { kind: "identity", bucket: BUCKET, path: foreign }))
        .status,
    ).toBe("forbidden");

    const badPath = storagePath(a.id);
    const badKindPost = await insertPost(a.id, "PUBLIC", [
      { type: "video", bucket: "avatars", path: badPath },
    ]);
    expect(
      (await svc.getMediaUrl(badKindPost, { kind: "identity", bucket: "avatars", path: badPath }))
        .status,
    ).toBe("forbidden");
  });

  test("missing object does not leak or grant access", async () => {
    if (!live) return;
    const missing = storagePath(a.id);
    const post = await insertPost(a.id, "PUBLIC", [
      { type: "image", bucket: BUCKET, path: missing },
    ]);
    const svc = serviceFor(a.client, a.id, { isEnabled: () => true });
    const res = await svc.getMediaUrl(post, { kind: "identity", bucket: BUCKET, path: missing });
    expect(res.status).not.toBe("ready");
  });

  test("privacy change blocks new signatures for a previously visible PUBLIC post", async () => {
    if (!live) return;
    if (!admin) throw new Error("admin missing");
    const post = await insertPost(a.id, "PUBLIC", mediaRef());
    await disconnect(a.id, b.id);
    const svc = serviceFor(b.client, b.id, { isEnabled: () => true });
    expect((await svc.getMediaUrl(post, { kind: "index", index: 0 })).status).toBe("ready");

    await admin.from("posts").update({ privacy: "PRIVATE" }).eq("id", post);
    const after = serviceFor(b.client, b.id, { isEnabled: () => true });
    expect((await after.getMediaUrl(post, { kind: "index", index: 0 })).status).toBe("forbidden");
  });

  test("server-side TTL is bounded to 60–300s and expiresAt reflects it", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", mediaRef());
    let observed = -1;
    // The composed service chooses the TTL server-side (default 300s, clamped).
    const svc = serviceFor(a.client, a.id, {
      isEnabled: () => true,
      signer: async (_object, ttl) => {
        observed = ttl;
        return { status: "ready", url: "https://example.invalid/x", expiresIn: ttl };
      },
    });
    const before = Date.now();
    const res = await svc.getMediaUrl(post, { kind: "index", index: 0 });
    expect(res.status).toBe("ready");
    expect(observed).toBeLessThanOrEqual(300);
    expect(observed).toBeGreaterThanOrEqual(60);
    if (res.status === "ready") {
      expect(res.expiresAt - before).toBeGreaterThan(0);
      expect(res.expiresAt - before).toBeLessThanOrEqual(300_000 + 5_000);
    }
  });

  test("disabled flag prevents any signature (no privileged call)", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", mediaRef());
    // Default isEnabled resolves via the real gates. Remote auth ON, media OFF.
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setMediaUrlGateForTests({ isFlagEnabled: () => false });
    let signCalls = 0;
    const off = serviceFor(a.client, a.id, {
      signer: async () => {
        signCalls += 1;
        return { status: "ready", url: "https://example.invalid/x", expiresIn: 300 };
      },
    });
    expect((await off.getMediaUrl(post, { kind: "index", index: 0 })).status).toBe("unavailable");
    expect(signCalls).toBe(0);
  });

  test("signed URLs and tokens are never logged by the composition", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", mediaRef());
    const captured: unknown[][] = [];
    const original = { log: console.log, warn: console.warn, error: console.error };
    console.log = (...args: unknown[]) => captured.push(args);
    console.warn = (...args: unknown[]) => captured.push(args);
    console.error = (...args: unknown[]) => captured.push(args);
    let url = "";
    try {
      const svc = serviceFor(a.client, a.id, { isEnabled: () => true });
      const res = await svc.getMediaUrl(post, { kind: "index", index: 0 });
      if (res.status === "ready") url = res.url;
    } finally {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
    }
    const flat = JSON.stringify(captured);
    expect(flat.includes("token=")).toBe(false);
    expect(url === "" || !flat.includes(url)).toBe(true);

    const source = await readFile(
      join(import.meta.dir, "../src/lib/media/media-server-authorization.server.ts"),
      "utf8",
    );
    expect(source.includes("console.")).toBe(false);
  });

  test("authorization is evaluated per viewer, with no cross-user leakage", async () => {
    if (!live) return;
    const priv = await insertPost(a.id, "PRIVATE", mediaRef());
    const ownerSvc = serviceFor(a.client, a.id, { isEnabled: () => true });
    const otherSvc = serviceFor(b.client, b.id, { isEnabled: () => true });
    expect((await ownerSvc.getMediaUrl(priv, { kind: "index", index: 0 })).status).toBe("ready");
    expect((await otherSvc.getMediaUrl(priv, { kind: "index", index: 0 })).status).toBe(
      "forbidden",
    );
  });

  test("row RLS does not gate direct object access (observed gap, not fixed here)", async () => {
    if (!live) return;
    const priv = await insertPost(a.id, "PRIVATE", mediaRef());
    const rowVisible = await b.client.from("posts").select("id").eq("id", priv).maybeSingle();
    expect(rowVisible.data).toBeNull();
    const direct = await b.client.storage.from(BUCKET).download(pathA);
    expect(direct.error).toBeNull();
  });
});
