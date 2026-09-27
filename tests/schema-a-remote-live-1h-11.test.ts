import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createSchemaAClient,
  RemoteCaronaRepository,
  RemoteCatalogRepository,
  RemoteContentRepository,
  RemoteConversationRepository,
  RemoteErrorCode,
  RemoteProfileRepository,
  RemoteRepositoryError,
  RemoteReservationRepository,
  RemoteSaveRepository,
  RemoteSocialRepository,
  type SchemaAClient,
} from "../src/integrations/supabase/remote";
import { isLocalSchemaAReachable, loadLocalSchemaAEnv } from "./helpers/schema-a-remote-local";

type Actor = {
  id: string;
  email: string;
  password: string;
  client: SchemaAClient;
  profile: RemoteProfileRepository;
  social: RemoteSocialRepository;
  conversation: RemoteConversationRepository;
  content: RemoteContentRepository;
  catalog: RemoteCatalogRepository;
  reservation: RemoteReservationRepository;
  carona: RemoteCaronaRepository;
  save: RemoteSaveRepository;
};

const localEnv = await loadLocalSchemaAEnv();
const live = Boolean(localEnv && (await isLocalSchemaAReachable(localEnv)));

let admin: SupabaseClient | null = null;
const actors: Actor[] = [];
const stamp = Date.now();

function actorOf(index: number): Actor {
  const actor = actors[index];
  if (!actor) throw new Error("live fixture missing");
  return actor;
}

async function createActor(
  email: string,
  password: string,
  envUrl: string,
  anonKey: string,
): Promise<Actor> {
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
  return {
    id: created.data.user.id,
    email,
    password,
    client,
    profile: new RemoteProfileRepository(client),
    social: new RemoteSocialRepository(client),
    conversation: new RemoteConversationRepository(client),
    content: new RemoteContentRepository(client),
    catalog: new RemoteCatalogRepository(client),
    reservation: new RemoteReservationRepository(client),
    carona: new RemoteCaronaRepository(client),
    save: new RemoteSaveRepository(client),
  };
}

beforeAll(async () => {
  if (!live || !localEnv) return;
  admin = createClient(localEnv.url, localEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  actors.push(
    await createActor(
      `1h11-a-${stamp}@connexy.local`,
      "1h11-pass-A!",
      localEnv.url,
      localEnv.anonKey,
    ),
    await createActor(
      `1h11-b-${stamp}@connexy.local`,
      "1h11-pass-B!",
      localEnv.url,
      localEnv.anonKey,
    ),
    await createActor(
      `1h11-c-${stamp}@connexy.local`,
      "1h11-pass-C!",
      localEnv.url,
      localEnv.anonKey,
    ),
  );
});

afterAll(async () => {
  await Promise.all(actors.map((actor) => actor.client.auth.signOut()));
});

describe.skipIf(!live)("1H-11 remote repositories — live Schema A", () => {
  test("Profile and Profile Private stay split; private is owner-only", async () => {
    if (!live) return;
    const a = actorOf(0);
    const b = actorOf(1);
    const own = await a.profile.getOwn();
    expect(own.id).toBe(a.id);
    expect(own.handle.length).toBeGreaterThan(0);

    const updated = await a.profile.updateOwn({ name: "Ana 1H11", city: "Recife", bio: "public" });
    expect(updated.name).toBe("Ana 1H11");
    expect(updated.city).toBe("Recife");

    const priv = await a.profile.updateOwnPrivate({
      birth_date: "1994-04-04",
      home_address: "Rua Privada 11",
    });
    expect(priv.user_id).toBe(a.id);
    expect(priv.birth_date).toBe("1994-04-04");

    const leaked = await b.profile.getPrivateByUserId(a.id);
    expect(leaked).toBeNull();
    const visiblePublic = await b.profile.getById(a.id);
    expect(visiblePublic?.name).toBe("Ana 1H11");
  });

  test("Follow ≠ Request ≠ Connection; accept does not create a conversation", async () => {
    if (!live) return;
    const a = actorOf(0);
    const b = actorOf(1);
    const c = actorOf(2);

    const follow = await a.social.follow(b.id);
    expect(follow.follower_id).toBe(a.id);
    expect(follow.followee_id).toBe(b.id);

    try {
      await a.social.follow(a.id);
      throw new Error("self follow should fail");
    } catch (error) {
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    }

    const request = await a.social.sendRequest(b.id);
    expect(request.status).toBe("pending");
    expect(await c.social.getRequest(request.id)).toBeNull();

    const accepted = await b.social.acceptRequest(request.id);
    expect(accepted.request.status).toBe("accepted");
    expect(accepted.connection.user_a_id < accepted.connection.user_b_id).toBe(true);
    expect(accepted.connection.conversation_id).toBeNull();

    const outsiderConnections = await c.social.listConnections();
    expect(outsiderConnections.some((row) => row.id === accepted.connection.id)).toBe(false);

    const conversationsAfterAccept = await a.conversation.listMine();
    expect(conversationsAfterAccept).toEqual([]);
  });

  test("Conversation participants are explicit; pin and last_read_at live on the participant", async () => {
    if (!live) return;
    const a = actorOf(0);
    const b = actorOf(1);
    const c = actorOf(2);

    const created = await a.conversation.createDirect(b.id);
    expect(created.participants).toHaveLength(2);
    expect(created.participants.every((row) => row.status === "accepted")).toBe(true);

    const pinned = await a.conversation.setPinned(created.conversation.id, true);
    expect(pinned.pinned).toBe(true);
    expect(pinned.user_id).toBe(a.id);
    const peer = await b.conversation.getOwnParticipant(created.conversation.id);
    expect(peer?.pinned).toBe(false);

    const message = await a.conversation.sendMessage({
      conversationId: created.conversation.id,
      text: "oi schema a",
    });
    expect(message.text).toBe("oi schema a");
    expect("isUnread" in message).toBe(false);
    expect("is_unread" in message).toBe(false);

    const read = await b.conversation.markRead(created.conversation.id, message.created_at);
    expect(read.last_read_at).toBe(message.created_at);

    expect(await c.conversation.get(created.conversation.id)).toBeNull();
    expect(await c.conversation.listMessages(created.conversation.id)).toEqual([]);

    const visible = await b.conversation.listMessages(created.conversation.id);
    expect(visible.map((row) => row.id)).toContain(message.id);
  });

  test("Post privacy and Agora reel like/comment", async () => {
    if (!live) return;
    const a = actorOf(0);
    const c = actorOf(2);

    const pub = await a.content.createPost({ text: "publico", privacy: "PUBLIC" });
    const priv = await a.content.createPost({ text: "so eu", privacy: "PRIVATE" });
    expect(await c.content.getPost(pub.id)).not.toBeNull();
    expect(await c.content.getPost(priv.id)).toBeNull();

    const reel = await a.content.createReel({
      video_url: "https://example.invalid/1h11.mp4",
      caption: "agora",
      duration_s: 8,
    });
    const like = await c.content.likeReel(reel.id);
    expect(like.user_id).toBe(c.id);
    const comment = await c.content.commentReel({ reelId: reel.id, text: "top" });
    expect(comment.text).toBe("top");
    const comments = await a.content.listComments(reel.id);
    expect(comments.some((row) => row.id === comment.id)).toBe(true);
  });

  test("Business ≠ Place; Offer requires Business; Event has no ticket", async () => {
    if (!live) return;
    const a = actorOf(0);
    const b = actorOf(1);

    const business = await a.catalog.createBusiness({
      name: "Cafe 1H11",
      address: "Rua A, 10",
      category: "cafe",
    });
    const place = await a.catalog.createPlace({
      name: "Praca 1H11",
      address: "Centro",
      category: "praca",
    });
    expect(business.owner_id).toBe(a.id);
    expect(place.owner_id).toBe(a.id);
    expect(business.id).not.toBe(place.id);

    const event = await a.catalog.createEvent({
      title: "Sarau",
      location: "Praca 1H11",
      start_at: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(event.business_id).toBeNull();

    const offer = await a.catalog.createOffer({
      business_id: business.id,
      title: "10% cafe",
      discount_value: 10,
      valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    expect(offer.business_id).toBe(business.id);

    try {
      await a.catalog.createOffer({
        business_id: "00000000-0000-0000-0000-000000000000",
        title: "ghost",
        discount_value: 1,
        valid_until: new Date(Date.now() + 86400000).toISOString(),
      });
      throw new Error("ghost business should fail");
    } catch (error) {
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.FOREIGN_KEY);
    }

    expect(await b.catalog.getBusiness(business.id)).not.toBeNull();
  });

  test("Reservation starts pending and is not auto-confirmed", async () => {
    if (!live) return;
    const a = actorOf(0);
    const c = actorOf(2);
    const businesses = await a.catalog.listOwnBusinesses();
    const business = businesses[0];
    expect(business).toBeTruthy();

    const reservation = await c.reservation.create({
      resource_type: "business",
      business_id: business!.id,
      resource_name: business!.name,
      slot_date: "2026-10-02",
      slot_time: "19:00:00",
      party_size: 2,
    });
    expect(reservation.status).toBe("pending");
    expect(reservation.place_id).toBeNull();

    expect(await a.reservation.get(reservation.id)).not.toBeNull();
    const outsider = actorOf(1);
    expect(await outsider.reservation.get(reservation.id)).toBeNull();
  });

  test("Carona request cannot be the owner; accept decrements seats without GPS", async () => {
    if (!live) return;
    const a = actorOf(0);
    const b = actorOf(1);
    const offer = await a.carona.createOffer({
      origin: "Casa",
      destination: "Centro",
      meetup: "Portaria",
      ride_date: "2026-10-03",
      ride_time: "08:00:00",
      available_seats: 1,
    });
    try {
      await a.carona.requestSeat(offer.id);
      throw new Error("owner request should fail");
    } catch (error) {
      expect([RemoteErrorCode.CHECK, RemoteErrorCode.VALIDATION]).toContain(
        (error as RemoteRepositoryError).code,
      );
    }
    const request = await b.carona.requestSeat(offer.id);
    expect(request.status).toBe("requested");
    const accepted = await a.carona.acceptRequest(request.id);
    expect(accepted.request.status).toBe("accepted");
    expect(accepted.offer.available_seats).toBe(0);
    expect(accepted.offer.status).toBe("full");
  });

  test("Saves are owner-only and constrained to Schema A types", async () => {
    if (!live) return;
    const a = actorOf(0);
    const c = actorOf(2);
    const businesses = await a.catalog.listOwnBusinesses();
    const saved = await c.save.save("business", businesses[0]!.id);
    expect(saved.user_id).toBe(c.id);
    expect(await c.save.listMine()).toHaveLength(1);
    expect(await a.save.listMine()).toHaveLength(0);

    try {
      await c.save.save("ticket" as never, businesses[0]!.id);
      throw new Error("invalid type should fail");
    } catch (error) {
      expect((error as RemoteRepositoryError).code).toBe(RemoteErrorCode.VALIDATION);
    }
  });
});
