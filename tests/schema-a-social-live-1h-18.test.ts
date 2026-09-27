import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createSchemaAClient,
  RemoteConversationRepository,
  RemoteErrorCode,
  RemoteRepositoryError,
  RemoteSocialRepository,
  type SchemaAClient,
} from "../src/integrations/supabase/remote";
import { AdapterMappingError } from "../src/lib/adapters/schema-a/errors";
import { createSchemaASocial } from "../src/lib/social/schema-a-social";
import { isLocalSchemaAReachable, loadLocalSchemaAEnv } from "./helpers/schema-a-remote-local";

const localEnv = await loadLocalSchemaAEnv();
const live = Boolean(localEnv && (await isLocalSchemaAReachable(localEnv)));

let admin: SupabaseClient | null = null;
const clients: SchemaAClient[] = [];
const stamp = Date.now();

async function createUser(email: string, password: string, envUrl: string, anonKey: string) {
  if (!admin) throw new Error("admin client missing");
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("user create failed");
  }
  const client = createSchemaAClient(envUrl, anonKey);
  const session = await client.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  clients.push(client);
  const socialRepo = new RemoteSocialRepository(client);
  return {
    id: created.data.user.id,
    client,
    conversations: new RemoteConversationRepository(client),
    social: createSchemaASocial({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: created.data.user!.id }),
      social: socialRepo,
    }),
  };
}

describe.skipIf(!live)("1H-18 remote Social — live Schema A", () => {
  let a: Awaited<ReturnType<typeof createUser>>;
  let b: Awaited<ReturnType<typeof createUser>>;
  let c: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    if (!live || !localEnv) return;
    admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    a = await createUser(`s18a-${stamp}@local.test`, "password-a1", localEnv.url, localEnv.anonKey);
    b = await createUser(`s18b-${stamp}@local.test`, "password-b1", localEnv.url, localEnv.anonKey);
    c = await createUser(`s18c-${stamp}@local.test`, "password-c1", localEnv.url, localEnv.anonKey);
  });

  afterAll(async () => {
    for (const client of clients) await client.auth.signOut();
    if (admin && a) await admin.auth.admin.deleteUser(a.id);
    if (admin && b) await admin.auth.admin.deleteUser(b.id);
    if (admin && c) await admin.auth.admin.deleteUser(c.id);
  });

  test("follow, request, accept, decline, RLS isolation, no Conversation", async () => {
    if (!live) return;
    expect(a.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect((await a.social.getIdentity())?.userId).toBe(a.id);

    const followed = await a.social.follow(b.id);
    expect(followed.followerId).toBe(a.id);
    expect(followed.followeeId).toBe(b.id);
    expect(await a.social.isFollowing(b.id)).toBe(true);
    await a.social.unfollow(b.id);
    expect(await a.social.isFollowing(b.id)).toBe(false);

    const request = await a.social.sendRequest(b.id);
    expect(request.status).toBe("pending");
    expect(request.message).toBeNull();
    expect(await c.social.peekRequest(request.id)).toBeNull();

    try {
      await c.social.acceptRequest(request.id);
      throw new Error("outsider accept should fail");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.NOT_FOUND);
    }

    const accepted = await b.social.acceptRequest(request.id);
    expect(accepted.request.status).toBe("accepted");
    expect(accepted.connection.conversationId).toBeNull();
    expect(await a.social.isConnected(b.id)).toBe(true);

    expect(await a.conversations.listMine()).toEqual([]);
    expect(await b.conversations.listMine()).toEqual([]);

    const outsiderConnections = await c.social.listConnections();
    expect(outsiderConnections.some((row) => row.id === accepted.connection.id)).toBe(false);

    const declinedRequest = await a.social.sendRequest(c.id);
    const declined = await c.social.declineRequest(declinedRequest.id);
    expect(declined.status).toBe("declined");
    expect(await a.social.isConnected(c.id)).toBe(false);

    try {
      await a.social.follow("lucas");
      throw new Error("demo id should fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
  });
});
