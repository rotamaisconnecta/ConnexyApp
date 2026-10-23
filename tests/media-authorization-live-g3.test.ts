import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSchemaAClient, type SchemaAClient } from "../src/integrations/supabase/remote";
import { createMediaUrlService } from "../src/lib/media/media-authorization";
import { isLocalSchemaAReachable, loadLocalSchemaAEnv } from "./helpers/schema-a-remote-local";

/**
 * G3 — testes integrados LOCAIS de C6 contra a stack Supabase de desenvolvimento.
 * Nunca toca projeto remoto. Cria recursos sinteticos identificaveis e limpa tudo.
 * Se a stack local nao estiver acessivel, todo o arquivo e ignorado.
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
    .insert({ author_id: authorId, privacy, text: "g3 synthetic", media })
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

function serviceFor(viewerClient: SchemaAClient, viewerId: string | null, enabled = true) {
  return createMediaUrlService({
    isEnabled: () => enabled,
    getViewerId: async () => viewerId,
    loadPost: async (postId) => {
      const { data } = await viewerClient
        .from("posts")
        .select("id, author_id, privacy, media")
        .eq("id", postId)
        .maybeSingle();
      return data ?? null;
    },
    areConnected: async (v, author) => {
      const { data } = await viewerClient
        .from("connections")
        .select("user_a_id, user_b_id")
        .or(
          `and(user_a_id.eq.${v},user_b_id.eq.${author}),and(user_a_id.eq.${author},user_b_id.eq.${v})`,
        )
        .maybeSingle();
      return Boolean(data);
    },
    sign: async (object, ttlSeconds) => {
      const { data, error } = await viewerClient.storage
        .from(object.bucket)
        .createSignedUrl(object.path, ttlSeconds);
      if (error || !data?.signedUrl) return { status: "unavailable" };
      return { status: "ready", url: data.signedUrl, expiresIn: ttlSeconds };
    },
  });
}

describe.skipIf(!live)("G3 C6 — autorização de mídia integrada (local)", () => {
  let a: Awaited<ReturnType<typeof createUser>>;
  let b: Awaited<ReturnType<typeof createUser>>;
  let pathA: string;

  beforeAll(async () => {
    if (!live || !localEnv) return;
    admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    a = await createUser(`g3a-${stamp}@local.test`, "password-a3");
    b = await createUser(`g3b-${stamp}@local.test`, "password-b3");
    pathA = storagePath(a.id);
    const up = await admin.storage
      .from(BUCKET)
      .upload(pathA, new Blob(["synthetic-g3"], { type: "image/jpeg" }), {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (up.error) throw up.error;
    uploadedPaths.push(pathA);
  });

  afterAll(async () => {
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

  test("C6-2 owner can sign own PUBLIC, CONNECTIONS and PRIVATE media", async () => {
    if (!live) return;
    const pub = await insertPost(a.id, "PUBLIC", [{ type: "image", bucket: BUCKET, path: pathA }]);
    const conn = await insertPost(a.id, "CONNECTIONS", [
      { type: "image", bucket: BUCKET, path: pathA },
    ]);
    const priv = await insertPost(a.id, "PRIVATE", [
      { type: "image", bucket: BUCKET, path: pathA },
    ]);
    const svc = serviceFor(a.client, a.id);
    for (const id of [pub, conn, priv]) {
      const res = await svc.getMediaUrl(id, { kind: "identity", bucket: BUCKET, path: pathA });
      expect(res.status).toBe("ready");
    }
  });

  test("C6-1/C6-3 unauthenticated and disconnected user are denied", async () => {
    if (!live) return;
    const conn = await insertPost(a.id, "CONNECTIONS", [
      { type: "image", bucket: BUCKET, path: pathA },
    ]);
    const priv = await insertPost(a.id, "PRIVATE", [
      { type: "image", bucket: BUCKET, path: pathA },
    ]);

    const anon = serviceFor(b.client, null);
    expect((await anon.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("forbidden");
    expect((await anon.getMediaUrl(priv, { kind: "index", index: 0 })).status).toBe("forbidden");

    const other = serviceFor(b.client, b.id);
    expect((await other.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("forbidden");
    expect((await other.getMediaUrl(priv, { kind: "index", index: 0 })).status).toBe("forbidden");
  });

  test("C6-4/C6-5 connected user can sign CONNECTIONS; disconnect blocks new signatures", async () => {
    if (!live) return;
    const conn = await insertPost(a.id, "CONNECTIONS", [
      { type: "image", bucket: BUCKET, path: pathA },
    ]);
    await connect(a.id, b.id);
    const svc = serviceFor(b.client, b.id);
    expect((await svc.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("ready");

    await disconnect(a.id, b.id);
    const after = serviceFor(b.client, b.id);
    expect((await after.getMediaUrl(conn, { kind: "index", index: 0 })).status).toBe("forbidden");
  });

  test("C6-6/C6-7/C6-8 arbitrary, other-owner and incompatible-bucket refs are rejected", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", [{ type: "image", bucket: BUCKET, path: pathA }]);
    const svc = serviceFor(a.client, a.id);

    // C6-6: identity not present in the authorized row
    expect(
      (
        await svc.getMediaUrl(post, {
          kind: "identity",
          bucket: BUCKET,
          path: storagePath(a.id),
        })
      ).status,
    ).toBe("missing");

    // C6-7: path owned by another user, referenced in A's row
    const foreign = storagePath(b.id);
    const foreignPost = await insertPost(a.id, "PUBLIC", [
      { type: "image", bucket: BUCKET, path: foreign },
    ]);
    expect(
      (await svc.getMediaUrl(foreignPost, { kind: "identity", bucket: BUCKET, path: foreign }))
        .status,
    ).toBe("forbidden");

    // C6-8: bucket incompatible with kind (avatars only supports image)
    const badKind = storagePath(a.id);
    const badKindPost = await insertPost(a.id, "PUBLIC", [
      { type: "video", bucket: "avatars", path: badKind },
    ]);
    expect(
      (await svc.getMediaUrl(badKindPost, { kind: "identity", bucket: "avatars", path: badKind }))
        .status,
    ).toBe("forbidden");
  });

  test("C6-9 missing object does not grant access", async () => {
    if (!live) return;
    const missing = storagePath(a.id);
    const post = await insertPost(a.id, "PUBLIC", [
      { type: "image", bucket: BUCKET, path: missing },
    ]);
    const svc = serviceFor(a.client, a.id);
    const res = await svc.getMediaUrl(post, {
      kind: "identity",
      bucket: BUCKET,
      path: missing,
    });
    expect(res.status).not.toBe("ready");
  });

  test("C6-10 effective TTL respects the 300s maximum", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", [{ type: "image", bucket: BUCKET, path: pathA }]);
    let observedTtl = -1;
    const svc = createMediaUrlService({
      isEnabled: () => true,
      getViewerId: async () => a.id,
      loadPost: async () => ({
        id: post,
        author_id: a.id,
        privacy: "PUBLIC",
        media: [{ type: "image", bucket: BUCKET, path: pathA }],
      }),
      areConnected: async () => false,
      sign: async (_object, ttl) => {
        observedTtl = ttl;
        return { status: "ready", url: "https://example.invalid/x", expiresIn: ttl };
      },
      ttlSeconds: 99999,
    });
    const res = await svc.getMediaUrl(post, { kind: "index", index: 0 });
    expect(res.status).toBe("ready");
    expect(observedTtl).toBeLessThanOrEqual(300);
    expect(observedTtl).toBeGreaterThanOrEqual(60);
  });

  test("C6-11 an expired signed URL stops working locally", async () => {
    if (!live) return;
    if (!admin) throw new Error("admin missing");
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(pathA, 1);
    expect(error).toBeNull();
    const url = data?.signedUrl;
    expect(url).toBeString();
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(url!);
    expect(res.ok).toBe(false);
  });

  test("C6-13 disabled flag prevents any new signature", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", [{ type: "image", bucket: BUCKET, path: pathA }]);
    let signCalls = 0;
    const svc = createMediaUrlService({
      isEnabled: () => false,
      getViewerId: async () => a.id,
      loadPost: async () => ({
        id: post,
        author_id: a.id,
        privacy: "PUBLIC",
        media: [{ type: "image", bucket: BUCKET, path: pathA }],
      }),
      areConnected: async () => false,
      sign: async () => {
        signCalls += 1;
        return { status: "ready", url: "https://example.invalid/x", expiresIn: 300 };
      },
    });
    expect((await svc.getMediaUrl(post, { kind: "index", index: 0 })).status).toBe("unavailable");
    expect(signCalls).toBe(0);
  });

  test("C6-14 signed tokens are never logged by the service", async () => {
    if (!live) return;
    const post = await insertPost(a.id, "PUBLIC", [{ type: "image", bucket: BUCKET, path: pathA }]);
    const captured: unknown[][] = [];
    const original = { log: console.log, warn: console.warn, error: console.error };
    console.log = (...args: unknown[]) => captured.push(args);
    console.warn = (...args: unknown[]) => captured.push(args);
    console.error = (...args: unknown[]) => captured.push(args);
    let url = "";
    try {
      const svc = serviceFor(a.client, a.id);
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
      join(import.meta.dir, "../src/lib/media/media-authorization.ts"),
      "utf8",
    );
    expect(source.includes("console.")).toBe(false);
  });

  test("C6-16 direct object access is not gated by row RLS (observed gap)", async () => {
    if (!live) return;
    // A private row is invisible to B, but the object is reachable by any
    // authenticated user because the SELECT policy is bucket-wide.
    const priv = await insertPost(a.id, "PRIVATE", [
      { type: "image", bucket: BUCKET, path: pathA },
    ]);
    const rowVisible = await b.client.from("posts").select("id").eq("id", priv).maybeSingle();
    expect(rowVisible.data).toBeNull();

    const direct = await b.client.storage.from(BUCKET).download(pathA);
    expect(direct.error).toBeNull();
    expect(direct.data).not.toBeNull();
  });
});
