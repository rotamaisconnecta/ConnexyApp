import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createSchemaAClient,
  RemoteProfileRepository,
  type SchemaAClient,
} from "../src/integrations/supabase/remote";
import { createSchemaAProfile } from "../src/lib/profile/schema-a-profile";
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
  return {
    id: created.data.user.id,
    client,
    profiles: new RemoteProfileRepository(client),
  };
}

describe.skipIf(!live)("1H-17 remote Profile — live Schema A", () => {
  let owner: Awaited<ReturnType<typeof createUser>>;
  let peer: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    if (!live || !localEnv) return;
    admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    owner = await createUser(
      `p17a-${stamp}@local.test`,
      "password-a1",
      localEnv.url,
      localEnv.anonKey,
    );
    peer = await createUser(
      `p17b-${stamp}@local.test`,
      "password-b1",
      localEnv.url,
      localEnv.anonKey,
    );
  });

  afterAll(async () => {
    for (const client of clients) await client.auth.signOut();
    if (admin && owner) await admin.auth.admin.deleteUser(owner.id);
    if (admin && peer) await admin.auth.admin.deleteUser(peer.id);
  });

  test("read/write/reload use Auth UUID and keep private isolated", async () => {
    if (!live) return;
    const profile = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: owner.id }),
      profiles: owner.profiles,
    });
    const identity = await profile.getIdentity();
    expect(identity?.userId).toBe(owner.id);

    const saved = await profile.saveOwn({
      name: "Ana 1H17",
      handle: `ana17${stamp.toString(36).slice(-6)}`,
      photo: "",
      cover: "",
      city: "Recife",
      bio: "remoto",
      interests: ["Música", "Cafés", "Cinema"],
      privateAddresses: { home: "Rua Privada 17", work: "" },
      visibility: {
        confirmedActivity: "Conexões",
        likedPlaces: "Conexões",
        mutualFriends: "Todos",
      },
      birthDate: "1994-04-04",
      identityId: owner.id,
    });
    expect(saved.identityId).toBe(owner.id);
    expect(saved.name).toBe("Ana 1H17");

    const reloaded = await profile.loadOwn();
    expect(reloaded.name).toBe("Ana 1H17");
    expect(reloaded.privateAddresses.home).toBe("Rua Privada 17");

    const peerView = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => ({ userId: peer.id }),
      profiles: peer.profiles,
    });
    expect(await peerView.peekPrivate(owner.id)).toBeNull();

    await owner.client.auth.signOut();
    const afterLogout = createSchemaAProfile({
      isEnabled: () => true,
      getIdentity: async () => {
        const { data } = await owner.client.auth.getUser();
        return data.user?.id ? { userId: data.user.id } : null;
      },
      profiles: owner.profiles,
    });
    expect(await afterLogout.getIdentity()).toBeNull();
  });
});
