import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createSchemaAClient,
  RemoteConversationRepository,
  RemoteSocialRepository,
  type SchemaAClient,
} from "../src/integrations/supabase/remote";
import { AdapterMappingError } from "../src/lib/adapters/schema-a/errors";
import { createSchemaAConversations } from "../src/lib/chat/schema-a-conversations";
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
  const conversations = new RemoteConversationRepository(client);
  return {
    id: created.data.user.id,
    client,
    social: new RemoteSocialRepository(client),
    chat: createSchemaAConversations({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: created.data.user!.id }),
      conversations,
    }),
  };
}

describe.skipIf(!live)("1H-19 remote Conversations — live Schema A", () => {
  let a: Awaited<ReturnType<typeof createUser>>;
  let b: Awaited<ReturnType<typeof createUser>>;
  let c: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    if (!live || !localEnv) return;
    admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    a = await createUser(`c19a-${stamp}@local.test`, "password-a1", localEnv.url, localEnv.anonKey);
    b = await createUser(`c19b-${stamp}@local.test`, "password-b1", localEnv.url, localEnv.anonKey);
    c = await createUser(`c19c-${stamp}@local.test`, "password-c1", localEnv.url, localEnv.anonKey);
  });

  afterAll(async () => {
    for (const client of clients) await client.auth.signOut();
    if (admin && a) await admin.auth.admin.deleteUser(a.id);
    if (admin && b) await admin.auth.admin.deleteUser(b.id);
    if (admin && c) await admin.auth.admin.deleteUser(c.id);
  });

  test("create, send, pin, last_read_at, RLS, Connection does not create Conversation", async () => {
    if (!live) return;
    expect((await a.chat.getIdentity())?.userId).toBe(a.id);

    const request = await a.social.sendRequest(b.id);
    const accepted = await b.social.acceptRequest(request.id);
    expect(accepted.connection.conversation_id).toBeNull();
    expect(await a.chat.listThreads()).toEqual([]);

    const thread = await a.chat.createDirect(b.id);
    expect(thread.participants).toHaveLength(2);
    expect(thread.conversation.id).toBeTruthy();

    const sent = await a.chat.sendMessage(thread.conversation.id, "oi 1h19");
    expect(sent.senderId).toBe(a.id);
    expect(sent.text).toBe("oi 1h19");

    const listed = await b.chat.listMessages(thread.conversation.id);
    expect(listed.map((item) => item.text)).toEqual(["oi 1h19"]);
    expect(await c.chat.getThread(thread.conversation.id)).toBeNull();
    expect(await c.chat.listMessages(thread.conversation.id)).toEqual([]);

    await a.chat.setPinned(thread.conversation.id, true);
    expect((await a.chat.getThread(thread.conversation.id))?.pinned).toBe(true);
    expect((await b.chat.getThread(thread.conversation.id))?.pinned).toBe(false);

    const unreadBefore = await b.chat.getThread(thread.conversation.id);
    expect(unreadBefore?.unread).toBe(true);
    const aBefore = await a.chat.getThread(thread.conversation.id);
    await b.chat.markRead(thread.conversation.id);
    const unreadAfter = await b.chat.getThread(thread.conversation.id);
    expect(unreadAfter?.unread).toBe(false);
    expect((await a.chat.getThread(thread.conversation.id))?.own?.lastReadAt).toBe(
      aBefore?.own?.lastReadAt,
    );

    const reloaded = await a.chat.getThread(thread.conversation.id);
    expect(reloaded?.conversation.id).toBe(thread.conversation.id);
    expect(reloaded?.pinned).toBe(true);

    try {
      await a.chat.createDirect("lucas");
      throw new Error("demo id should fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
  });
});
