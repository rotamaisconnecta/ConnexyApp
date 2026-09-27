import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { BusinessCategory } from "../src/lib/marketplace/business-types";
import { CatalogKind } from "../src/lib/catalog/local-catalog";
import { PostPrivacy } from "../src/lib/types/post";
import { ReservationStatus } from "../src/lib/reservations/reservation-store";
import { CaronaOfferStatus, CaronaRequestStatus } from "../src/lib/carona/carona-store";
import { StoredMessageKind } from "../src/lib/persistence/domain/chat-entities";
import { reelLikeId } from "../src/lib/persistence/domain/reels-entities";
import {
  AdapterMappingCode,
  AdapterMappingError,
  assertDistinctIdentityContexts,
  demoIdentityIsRemoteAuth,
  derivedMessageFrom,
  derivedUnread,
  fromLocalSavedDetailId,
  pinnedUserIdsFromParticipants,
  toDomainBusiness,
  toDomainCaronaOffer,
  toDomainCaronaRequest,
  toDomainConnection,
  toDomainConnectionRequest,
  toDomainEvent,
  toDomainFollow,
  toDomainMessage,
  toDomainOffer,
  toDomainParticipant,
  toDomainPlace,
  toDomainPost,
  toDomainProfile,
  toDomainReel,
  toDomainReelComment,
  toDomainReelLike,
  toDomainReservation,
  toDomainSave,
  toRemoteBusinessInsert,
  toRemoteCaronaOfferInsert,
  toRemoteCaronaRequestInsert,
  toRemoteConnectionInsert,
  toRemoteConnectionRequestInsert,
  toRemoteEventInsert,
  toRemoteFollowInsert,
  toRemoteLocale,
  toRemoteMessageInsert,
  toRemoteOfferInsert,
  toRemoteParticipantInsert,
  toRemotePlaceInsert,
  toRemotePostInsert,
  toRemotePostPrivacy,
  toRemoteProfileInsert,
  toRemoteProfilePrivateInsert,
  toRemoteReelCommentInsert,
  toRemoteReelInsert,
  toRemoteReelLikeInsert,
  toRemoteReservationInsert,
  toRemoteReservationStatus,
  toRemoteSaveInsert,
  toSchemaAAuthIdentity,
  toStoredConversation,
  toStoredMessage,
} from "../src/lib/adapters/schema-a";
import type {
  BusinessRow,
  CaronaOfferRow,
  CaronaRequestRow,
  ConnectionRequestRow,
  ConnectionRow,
  ConversationParticipantRow,
  ConversationRow,
  EventRow,
  FollowRow,
  MessageRow,
  OfferRow,
  PlaceRow,
  PostRow,
  ProfilePrivateRow,
  ProfileRow,
  ReelCommentRow,
  ReelLikeRow,
  ReelRow,
  ReservationRow,
  SaveRow,
} from "../src/integrations/supabase/remote/types";

const projectRoot = join(import.meta.dir, "..");
const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb";
const CONV = "cccccccc-cccc-4ccc-accc-cccccccccccc";
const BIZ = "dddddddd-dddd-4ddd-addd-dddddddddddd";
const PLACE = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";
const REEL = "ffffffff-ffff-4fff-afff-ffffffffffff";
const NOW = "2026-09-25T03:00:00.000Z";
const NOW_MS = Date.parse(NOW);

async function walkFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      await walkFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

describe("1H-12 adapters — isolation", () => {
  test("UI does not import schema-a adapters", async () => {
    const hits: string[] = [];
    for (const root of [
      "src/routes",
      "src/components",
      "src/hooks",
      "src/providers",
      "src/services",
    ]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("lib/adapters/schema-a")) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  test("adapters do not call getDemoIdentity or remote repositories", async () => {
    const files = await walkFiles(join(projectRoot, "src/lib/adapters/schema-a"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = await readFile(file, "utf8");
      expect(text.includes("getDemoIdentity(")).toBe(false);
      expect(text.includes("RemoteProfileRepository")).toBe(false);
      expect(text.includes("ChatRepository")).toBe(false);
    }
  });
});

describe("1H-12 Identity / Profile", () => {
  test("demo identity is not remote auth", () => {
    expect(demoIdentityIsRemoteAuth({ id: "lucas", name: "Lucas", photo: "" })).toBe(false);
    expect(demoIdentityIsRemoteAuth({ id: A, name: "Ana", photo: "" })).toBe(true);
    expect(toSchemaAAuthIdentity(A).userId).toBe(A);
    expect(() => toSchemaAAuthIdentity("lucas")).toThrow(AdapterMappingError);
    assertDistinctIdentityContexts({ id: "lucas", name: "Lucas", photo: "" }, { userId: A });
  });

  test("profile public/private round-trip; blob is not copied wholesale", () => {
    const local = {
      name: "Ana",
      handle: "ana",
      photo: "https://img/a.jpg",
      cover: "https://img/c.jpg",
      city: "Recife",
      bio: "oi",
      interests: ["jazz"],
      privateAddresses: { home: "Rua A", work: "Rua B" },
      visibility: {
        confirmedActivity: "Conexões" as const,
        likedPlaces: "Todos" as const,
        mutualFriends: "Somente você" as const,
      },
      age: 31,
      birthDate: "1994-04-04",
      identityId: A,
    };
    const publicInsert = toRemoteProfileInsert(local, A, toRemoteLocale("Português"));
    expect(publicInsert).not.toHaveProperty("privateAddresses");
    expect(publicInsert).not.toHaveProperty("birth_date");
    expect(publicInsert.locale).toBe("pt-BR");
    const privateInsert = toRemoteProfilePrivateInsert(local, A);
    expect(privateInsert.user_id).toBe(A);
    expect(privateInsert.home_address).toBe("Rua A");

    const publicRow: ProfileRow = {
      id: A,
      name: "Ana",
      handle: "ana",
      photo_url: "https://img/a.jpg",
      cover_url: "https://img/c.jpg",
      city: "Recife",
      bio: "oi",
      interests: ["jazz"],
      age: 31,
      locale: "pt-BR",
      visibility: publicInsert.visibility ?? {},
      created_at: NOW,
      updated_at: NOW,
      headline: null,
      mood_emoji: null,
      mood_text: null,
      now_playing_kind: null,
      now_playing_subtitle: null,
      now_playing_title: null,
      vibe_tags: [],
      looks_for: [],
    };
    const privateRow: ProfilePrivateRow = {
      user_id: A,
      birth_date: "1994-04-04",
      home_address: "Rua A",
      work_address: "Rua B",
      updated_at: NOW,
    };
    const back = toDomainProfile(publicRow, privateRow);
    expect(back.name).toBe("Ana");
    expect(back.privateAddresses.home).toBe("Rua A");
    expect(back.birthDate).toBe("1994-04-04");
    expect(back.visibility.likedPlaces).toBe("Todos");
    expect(back.identityId).toBe(A);
  });

  test("private row null keeps public profile without inventing addresses", () => {
    const publicRow: ProfileRow = {
      id: A,
      name: "Ana",
      handle: "ana",
      photo_url: null,
      cover_url: null,
      city: null,
      bio: null,
      interests: [],
      age: null,
      locale: null,
      visibility: {
        confirmed_activity: "connections",
        liked_places: "connections",
        mutual_connections: "everyone",
      },
      created_at: NOW,
      updated_at: NOW,
      headline: null,
      mood_emoji: null,
      mood_text: null,
      now_playing_kind: null,
      now_playing_subtitle: null,
      now_playing_title: null,
      vibe_tags: [],
      looks_for: [],
    };
    const back = toDomainProfile(publicRow, null);
    expect(back.privateAddresses).toEqual({ home: "", work: "" });
    expect(back.birthDate).toBeUndefined();
  });
});

describe("1H-12 Social", () => {
  test("Follow round-trip does not create a connection", () => {
    const insert = toRemoteFollowInsert({ followerId: A, followeeId: B, createdAt: NOW_MS });
    expect(insert.follower_id).toBe(A);
    const row: FollowRow = {
      id: CONV,
      follower_id: A,
      followee_id: B,
      created_at: NOW,
    };
    const back = toDomainFollow(row);
    expect(back.followerId).toBe(A);
    expect(back.followeeId).toBe(B);
    expect(back).not.toHaveProperty("conversationId");
  });

  test("ConnectionRequest drops local message; does not accept as connection", () => {
    const insert = toRemoteConnectionRequestInsert({
      id: "local-req",
      fromUserId: A,
      toUserId: B,
      message: "oi, vamos?",
      status: "pending",
      createdAt: NOW_MS,
    });
    expect(insert).not.toHaveProperty("message");
    const row: ConnectionRequestRow = {
      id: CONV,
      from_user_id: A,
      to_user_id: B,
      status: "pending",
      created_at: NOW,
      updated_at: NOW,
      responded_at: null,
    };
    expect(toDomainConnectionRequest(row).message).toBeNull();
  });

  test("Connection round-trip keeps conversation_id optional and canonical", () => {
    const insert = toRemoteConnectionInsert({
      userAId: B,
      userBId: A,
      conversationId: "demo-direct-lucas--beatriz",
      connectedAt: NOW_MS,
    });
    expect(insert.user_a_id).toBe(A);
    expect(insert.user_b_id).toBe(B);
    expect(insert.conversation_id).toBeNull();
    const row: ConnectionRow = {
      id: CONV,
      user_a_id: A,
      user_b_id: B,
      conversation_id: null,
      connected_at: NOW,
    };
    expect(toDomainConnection(row).conversationId).toBeNull();
  });
});

describe("1H-12 Conversation / Participant / Message", () => {
  test("pin and last_read_at live on the participant", () => {
    const participantInsert = toRemoteParticipantInsert({
      conversationId: CONV,
      userId: A,
      pinned: true,
      lastReadAt: NOW,
      gestureHandledAt: NOW_MS,
    });
    expect(participantInsert.pinned).toBe(true);
    expect(participantInsert.last_read_at).toBe(NOW);
    const row: ConversationParticipantRow = {
      id: B,
      conversation_id: CONV,
      user_id: A,
      status: "accepted",
      pinned: true,
      last_read_at: NOW,
      gesture_handled_at: NOW,
      invited_at: NOW,
      responded_at: null,
      joined_at: NOW,
      created_at: NOW,
    };
    const domain = toDomainParticipant(row);
    expect(domain.pinned).toBe(true);
    expect(domain.lastReadAt).toBe(NOW);
    expect(pinnedUserIdsFromParticipants([row])).toEqual([A]);
  });

  test("unread is derived; message has no isUnread", () => {
    expect(
      derivedUnread({ lastMessageAt: NOW, lastReadAt: null, lastSenderId: B, viewerId: A }),
    ).toBe(true);
    expect(
      derivedUnread({ lastMessageAt: NOW, lastReadAt: NOW, lastSenderId: B, viewerId: A }),
    ).toBe(false);
    const messageRow: MessageRow = {
      id: B,
      conversation_id: CONV,
      sender_id: A,
      kind: "text",
      text: "oi",
      created_at: NOW,
      deleted_at: null,
      edited_at: null,
      media_bucket: null,
      media_duration_ms: null,
      media_mime: null,
      media_path: null,
      payload: { title: "x" },
      shared_entity_id: null,
      shared_entity_type: null,
    };
    const adapted = toDomainMessage(messageRow, B);
    expect(adapted.from).toBe("them");
    expect("isUnread" in adapted).toBe(false);
    const stored = toStoredMessage(adapted);
    expect(stored.kind).toBe(StoredMessageKind.TEXT);
    const insert = toRemoteMessageInsert(stored, A);
    expect(insert).not.toHaveProperty("is_unread");
    expect(insert.sender_id).toBe(A);
    expect(insert.payload).toEqual({ title: "x" });
  });

  test("conversation aggregate maps last message without inventing pin on the row", () => {
    const conv: ConversationRow = {
      id: CONV,
      created_by: A,
      kind: "direct",
      name: null,
      source_conversation_id: null,
      created_at: NOW,
      updated_at: NOW,
      last_message_at: NOW,
      last_message_kind: "text",
      last_message_text: "oi",
    };
    const participants: ConversationParticipantRow[] = [
      {
        id: A,
        conversation_id: CONV,
        user_id: A,
        status: "accepted",
        pinned: true,
        last_read_at: NOW,
        gesture_handled_at: null,
        invited_at: NOW,
        responded_at: null,
        joined_at: NOW,
        created_at: NOW,
      },
      {
        id: B,
        conversation_id: CONV,
        user_id: B,
        status: "accepted",
        pinned: false,
        last_read_at: null,
        gesture_handled_at: null,
        invited_at: NOW,
        responded_at: null,
        joined_at: NOW,
        created_at: NOW,
      },
    ];
    const stored = toStoredConversation(conv, participants, A);
    expect(stored.pinnedByUserIds).toEqual([A]);
    expect(stored.lastMessageText).toBe("oi");
    expect(derivedMessageFrom(A, A)).toBe("me");
  });
});

describe("1H-12 Post / Reel", () => {
  test("post round-trip keeps privacy and media; FRIENDS collapses", () => {
    expect(toRemotePostPrivacy(PostPrivacy.FRIENDS)).toEqual({
      privacy: "CONNECTIONS",
      collapsedFromFriends: true,
    });
    const post = {
      id: "local-post",
      authorId: A,
      authorName: "Ana",
      authorPhoto: "p",
      authorHandle: "ana",
      text: "hello",
      media: [{ preview: "data:image/png;base64,xx", type: "image" as const }],
      category: "TEXT",
      privacy: PostPrivacy.PUBLIC,
      locationLabel: "Recife",
      hashtags: ["a"],
      createdAt: NOW_MS,
    };
    const insert = toRemotePostInsert(post, A);
    expect(insert.author_id).toBe(A);
    expect(insert).not.toHaveProperty("authorName");
    const row: PostRow = {
      id: CONV,
      author_id: A,
      text: "hello",
      category: "TEXT",
      privacy: "PUBLIC",
      location_label: "Recife",
      hashtags: ["a"],
      media: insert.media ?? [],
      created_at: NOW,
    };
    const back = toDomainPost(row, { authorName: "Ana", authorPhoto: "p", authorHandle: "ana" });
    expect(back.text).toBe("hello");
    expect(back.media).toEqual(post.media);
    expect(back.privacy).toBe(PostPrivacy.PUBLIC);
  });

  test("reel insert requires media url and does not send author snapshot", () => {
    const reel = {
      id: "local-reel",
      caption: "agora",
      category: "MOMENT" as const,
      author: {
        id: A,
        name: "Ana",
        handle: "ana",
        photoUrl: "p",
        verified: true,
        profession: "dev",
        isFollowing: true,
      },
      context: null,
      durationS: 8,
      createdAt: NOW,
      persistence: "local" as const,
    };
    expect(() => toRemoteReelInsert(reel, { videoUrl: "" }, A)).toThrow(AdapterMappingError);
    const insert = toRemoteReelInsert(reel, { videoUrl: "https://cdn/v.mp4", posterUrl: null }, A);
    expect(insert.author_id).toBe(A);
    expect(insert).not.toHaveProperty("author");
    expect(insert).not.toHaveProperty("persistence");
    expect(insert).not.toHaveProperty("isFollowing");
    const row: ReelRow = {
      id: REEL,
      author_id: A,
      caption: "agora",
      category: "MOMENT",
      duration_s: 8,
      video_url: "https://cdn/v.mp4",
      poster_url: null,
      created_at: NOW,
      audio_label: null,
      context_id: null,
      context_title: null,
      context_type: null,
      place_id: null,
      tagged_user_ids: [],
    };
    const back = toDomainReel(row, reel.author);
    expect(back.caption).toBe("agora");
    expect(back.persistence).toBe("supabase");
  });

  test("like and comment round-trip; likes/likedByMe are not remote", () => {
    const likeInsert = toRemoteReelLikeInsert({
      id: reelLikeId(REEL, A),
      reelId: REEL,
      userId: A,
      createdAt: NOW,
    });
    const likeRow: ReelLikeRow = { id: CONV, reel_id: REEL, user_id: A, created_at: NOW };
    expect(toDomainReelLike(likeRow).id).toBe(reelLikeId(REEL, A));
    expect(likeInsert).not.toHaveProperty("likedByMe");
    const commentInsert = toRemoteReelCommentInsert({
      id: "local-c",
      reelId: REEL,
      parentId: null,
      siblingOrder: 0,
      text: "top",
      authorId: A,
      authorName: "Ana",
      authorPhoto: "p",
      createdAt: NOW,
      likes: 9,
      likedByMe: true,
    });
    expect(commentInsert).not.toHaveProperty("likes");
    expect(commentInsert).not.toHaveProperty("authorName");
    const commentRow: ReelCommentRow = {
      id: CONV,
      reel_id: REEL,
      author_id: A,
      text: "top",
      parent_id: null,
      sibling_order: 0,
      created_at: NOW,
    };
    const back = toDomainReelComment(commentRow, { authorName: "Ana", authorPhoto: "p" });
    expect(back.likes).toBe(0);
    expect(back.likedByMe).toBe(false);
  });
});

describe("1H-12 Catalog", () => {
  test("Business ≠ Place round-trip; owner is not invented", () => {
    expect(() =>
      toRemoteBusinessInsert(
        {
          id: "business-1",
          kind: CatalogKind.BUSINESS,
          ownerId: "lucas",
          createdAt: NOW_MS,
          updatedAt: NOW_MS,
          name: "Cafe",
          category: BusinessCategory.CAFE,
          address: "Rua 1",
          description: "x",
        },
        "lucas",
      ),
    ).toThrow(AdapterMappingError);
    const bizInsert = toRemoteBusinessInsert(
      {
        id: "business-1",
        kind: CatalogKind.BUSINESS,
        ownerId: A,
        createdAt: NOW_MS,
        updatedAt: NOW_MS,
        name: "Cafe",
        category: BusinessCategory.CAFE,
        address: "Rua 1",
        description: "x",
        cover: "c",
        lat: -8.05,
        lng: -34.88,
      },
      A,
    );
    expect(bizInsert.owner_id).toBe(A);
    const bizRow: BusinessRow = {
      id: BIZ,
      owner_id: A,
      name: "Cafe",
      category: BusinessCategory.CAFE,
      address: "Rua 1",
      description: "x",
      cover_url: "c",
      lat: -8.05,
      lng: -34.88,
      created_at: NOW,
      updated_at: NOW,
    };
    expect(toDomainBusiness(bizRow).kind).toBe(CatalogKind.BUSINESS);
    const placeRow: PlaceRow = {
      id: PLACE,
      owner_id: A,
      name: "Praca",
      category: "praca",
      address: "Centro",
      description: null,
      hours: "8-18",
      cover_url: null,
      lat: null,
      lng: null,
      slug: null,
      created_at: NOW,
      updated_at: NOW,
    };
    expect(toDomainPlace(placeRow).kind).toBe(CatalogKind.PLACE);
    expect(toDomainPlace(placeRow).id).not.toBe(toDomainBusiness(bizRow).id);
  });

  test("Event has no ticket; Offer requires business UUID", () => {
    const eventInsert = toRemoteEventInsert(
      {
        id: "event-1",
        kind: CatalogKind.EVENT,
        ownerId: A,
        createdAt: NOW_MS,
        updatedAt: NOW_MS,
        title: "Sarau",
        description: "",
        location: "Centro",
        startAt: NOW,
        endAt: NOW,
      },
      A,
    );
    expect(eventInsert).not.toHaveProperty("ticket_id");
    expect(eventInsert.business_id).toBeNull();
    const eventRow: EventRow = {
      id: CONV,
      owner_id: A,
      title: "Sarau",
      description: null,
      location: "Centro",
      start_at: NOW,
      end_at: null,
      capacity: null,
      price: null,
      photo_url: null,
      business_id: null,
      created_at: NOW,
      updated_at: NOW,
    };
    expect(toDomainEvent(eventRow).businessId).toBeUndefined();
    expect(() =>
      toRemoteOfferInsert(
        {
          id: "offer-1",
          kind: CatalogKind.OFFER,
          ownerId: A,
          createdAt: NOW_MS,
          updatedAt: NOW_MS,
          businessId: "business-local",
          title: "10%",
          description: "",
          discountValue: 10,
          validUntil: NOW,
        },
        A,
      ),
    ).toThrow(AdapterMappingError);
    const offerInsert = toRemoteOfferInsert(
      {
        id: "offer-1",
        kind: CatalogKind.OFFER,
        ownerId: A,
        createdAt: NOW_MS,
        updatedAt: NOW_MS,
        businessId: BIZ,
        title: "10%",
        description: "cafe",
        discountValue: 10,
        validUntil: NOW,
      },
      A,
    );
    expect(offerInsert.business_id).toBe(BIZ);
    const offerRow: OfferRow = {
      id: CONV,
      owner_id: A,
      business_id: BIZ,
      title: "10%",
      description: "cafe",
      discount_value: 10,
      valid_until: NOW,
      created_at: NOW,
      updated_at: NOW,
    };
    expect(toDomainOffer(offerRow).businessId).toBe(BIZ);
  });
});

describe("1H-12 Reservation / Carona / Save", () => {
  test("reservation insert is pending; completed is unmapped; requested↔pending", () => {
    expect(toRemoteReservationStatus(ReservationStatus.REQUESTED)).toBe("pending");
    expect(() => toRemoteReservationStatus(ReservationStatus.COMPLETED)).toThrow(
      AdapterMappingError,
    );
    const insert = toRemoteReservationInsert(
      {
        id: "reservation-1",
        userId: A,
        resourceId: BIZ,
        resourceType: "business",
        resourceName: "Cafe",
        date: "2026-10-02",
        time: "19:00",
        partySize: 2,
        status: ReservationStatus.CONFIRMED,
        createdAt: NOW_MS,
      },
      A,
    );
    expect(insert.status).toBe("pending");
    expect(insert.business_id).toBe(BIZ);
    expect(insert.place_id).toBeNull();
    const row: ReservationRow = {
      id: CONV,
      user_id: A,
      resource_type: "business",
      business_id: BIZ,
      place_id: null,
      resource_name: "Cafe",
      slot_date: "2026-10-02",
      slot_time: "19:00:00",
      party_size: 2,
      status: "pending",
      created_at: NOW,
      updated_at: NOW,
    };
    const back = toDomainReservation(row);
    expect(back.status).toBe(ReservationStatus.REQUESTED);
    expect(back.time).toBe("19:00");
    expect(back.resourceId).toBe(BIZ);
  });

  test("carona offer/request round-trip does not become Trip", () => {
    const offerInsert = toRemoteCaronaOfferInsert(
      {
        id: "carona-1",
        ownerId: A,
        origin: "Casa",
        destination: "Centro",
        meetup: "Portaria",
        date: "2026-10-03",
        time: "08:00",
        availableSeats: 2,
        status: CaronaOfferStatus.ACTIVE,
        createdAt: NOW_MS,
      },
      A,
    );
    expect(offerInsert).not.toHaveProperty("trip_id");
    expect(offerInsert).not.toHaveProperty("dispatcher");
    const offerRow: CaronaOfferRow = {
      id: CONV,
      owner_id: A,
      origin: "Casa",
      destination: "Centro",
      meetup: "Portaria",
      ride_date: "2026-10-03",
      ride_time: "08:00:00",
      available_seats: 2,
      status: "active",
      created_at: NOW,
      updated_at: NOW,
    };
    expect(toDomainCaronaOffer(offerRow).date).toBe("2026-10-03");
    const requestInsert = toRemoteCaronaRequestInsert(
      {
        id: "req-1",
        rideOfferId: CONV,
        requesterId: B,
        status: CaronaRequestStatus.REQUESTED,
        createdAt: NOW_MS,
        conversationId: "demo-direct-a--b",
      },
      B,
    );
    expect(requestInsert.conversation_id).toBeNull();
    const requestRow: CaronaRequestRow = {
      id: BIZ,
      ride_offer_id: CONV,
      requester_id: B,
      status: "requested",
      conversation_id: null,
      created_at: NOW,
      updated_at: NOW,
    };
    expect(toDomainCaronaRequest(requestRow).conversationId).toBeUndefined();
  });

  test("saves require Schema A types; untyped local ids are not invented FKs", () => {
    expect(fromLocalSavedDetailId("abc").targetType).toBeNull();
    expect(() => toRemoteSaveInsert({ userId: A, targetType: "ticket", targetId: BIZ })).toThrow(
      AdapterMappingError,
    );
    const insert = toRemoteSaveInsert({ userId: A, targetType: "business", targetId: BIZ });
    const row: SaveRow = {
      id: CONV,
      user_id: A,
      target_type: "business",
      target_id: BIZ,
      created_at: NOW,
    };
    const back = toDomainSave(row);
    expect(back.targetType).toBe("business");
    expect(back.targetId).toBe(BIZ);
    expect(insert.user_id).toBe(A);
  });
});
