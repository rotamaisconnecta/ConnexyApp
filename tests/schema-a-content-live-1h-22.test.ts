import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createSchemaAClient,
  RemoteContentRepository,
  RemoteProfileRepository,
  type SchemaAClient,
} from "../src/integrations/supabase/remote";
import { AdapterMappingError } from "../src/lib/adapters/schema-a/errors";
import { createSchemaAContent } from "../src/lib/content/schema-a-content";
import type { DemoPost } from "../src/lib/demo/demo-posts";
import { isLocalSchemaAReachable, loadLocalSchemaAEnv } from "./helpers/schema-a-remote-local";

const localEnv = await loadLocalSchemaAEnv();
const live = Boolean(localEnv && (await isLocalSchemaAReachable(localEnv)));

let admin: SupabaseClient | null = null;
const clients: SchemaAClient[] = [];
const createdIds: string[] = [];
const stamp = Date.now();

function draft(overrides: Partial<DemoPost> = {}): DemoPost {
  return {
    id: "demo-post-live",
    authorId: "lucas",
    authorName: "",
    authorPhoto: "",
    authorHandle: "",
    text: "conteudo 1h22",
    media: [],
    category: "TEXT",
    privacy: "PUBLIC",
    locationLabel: null,
    hashtags: ["connexy"],
    createdAt: Date.now(),
    ...overrides,
  };
}

async function createUser(email: string, password: string, envUrl: string, anonKey: string) {
  if (!admin) throw new Error("admin client missing");
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("user create failed");
  }
  const id = created.data.user.id;
  createdIds.push(id);
  const client = createSchemaAClient(envUrl, anonKey);
  const session = await client.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  clients.push(client);
  const profile = new RemoteProfileRepository(client);
  return {
    id,
    client,
    profile,
    content: createSchemaAContent({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: id }),
      getAuthor: async () => {
        const own = await profile.getOwn();
        return {
          authorName: own.name,
          authorPhoto: own.photo_url ?? "",
          authorHandle: own.handle,
        };
      },
      content: new RemoteContentRepository(client),
    }),
  };
}

describe.skipIf(!live)("1H-22 remote Content — live Schema A", () => {
  let a: Awaited<ReturnType<typeof createUser>>;
  let b: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    if (!live || !localEnv) return;
    admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    a = await createUser(`c22a-${stamp}@local.test`, "password-a2", localEnv.url, localEnv.anonKey);
    b = await createUser(`c22b-${stamp}@local.test`, "password-b2", localEnv.url, localEnv.anonKey);
  });

  afterAll(async () => {
    for (const client of clients) await client.auth.signOut();
    if (admin && createdIds.length > 0) {
      await admin.from("posts").delete().in("author_id", createdIds);
      await admin.from("profile_private").delete().in("user_id", createdIds);
      await admin.from("profiles").delete().in("id", createdIds);
      for (const id of createdIds) await admin.auth.admin.deleteUser(id);
    }
  });

  test("publish, RLS visibility, edit and delete own posts", async () => {
    if (!live) return;
    expect((await a.content.getIdentity())?.userId).toBe(a.id);

    const pub = await a.content.publishOwnPost(draft({ privacy: "PUBLIC" }));
    const priv = await a.content.publishOwnPost(draft({ privacy: "PRIVATE", text: "so eu" }));
    expect(pub.authorId).toBe(a.id);
    expect(pub.id).not.toBe("demo-post-live");

    expect(await b.content.peekPost(pub.id)).not.toBeNull();
    expect(await b.content.peekPost(priv.id)).toBeNull();

    const edited = await a.content.editOwnPost(pub.id, { text: "editado", privacy: "CONNECTIONS" });
    expect(edited.text).toBe("editado");
    expect(edited.privacy).toBe("CONNECTIONS");
    expect(await b.content.peekPost(pub.id)).toBeNull();

    const collapsed = await a.content.publishOwnPost(draft({ privacy: "FRIENDS" }));
    expect(collapsed.privacy).toBe("CONNECTIONS");

    const mine = await a.content.listOwnPosts();
    expect(mine.map((post) => post.id)).toContain(priv.id);

    await a.content.removeOwnPost(priv.id);
    expect(await a.content.getOwnPost(priv.id)).toBeNull();

    try {
      await a.content.publishOwnPost(draft({ authorId: a.id, privacy: "SECRET" }));
      throw new Error("unmapped privacy should fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
  });
});
