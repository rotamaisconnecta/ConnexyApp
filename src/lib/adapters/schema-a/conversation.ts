import type { DemoGroup, DemoGroupParticipant } from "@/lib/demo/demo-db";
import type {
  StoredConversation,
  StoredMessage,
  StoredMessageKindValue,
  StoredMessagePayload,
} from "@/lib/persistence/domain/chat-entities";
import { StoredMessageKind } from "@/lib/persistence/domain/chat-entities";
import type {
  ConversationKind,
  ConversationParticipantRow,
  ConversationRow,
  MessageKind,
  MessageRow,
  ParticipantStatus,
} from "@/integrations/supabase/remote/types";
import type { Json } from "../../../../supabase/schema-a.generated.ts";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import { epochMsToIso, isoToEpochMs, optionalSchemaAUuid, requireSchemaAUuid } from "./ids";

type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
type ParticipantInsert = Database["public"]["Tables"]["conversation_participants"]["Insert"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export type AdaptedConversation = {
  id: string;
  createdBy: string;
  kind: ConversationKind;
  name: string | null;
  sourceConversationId: string | null;
  createdAt: number;
  updatedAt: number;
  lastMessageText: string | null;
  lastMessageKind: MessageKind | null;
};

export type AdaptedParticipant = {
  id: string;
  conversationId: string;
  userId: string;
  status: ParticipantStatus;
  pinned: boolean;
  lastReadAt: string | null;
  gestureHandledAt: string | null;
  invitedAt: number;
  respondedAt: number | null;
};

export type AdaptedMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  at: number;
  kind: MessageKind;
  payload: StoredMessagePayload | null;
};

const LOCAL_KIND: ReadonlySet<string> = new Set(Object.values(StoredMessageKind));

export function toRemoteMessageKind(kind: StoredMessageKindValue | undefined): MessageKind {
  if (!kind || kind === StoredMessageKind.FILE) return "text";
  return kind;
}

export function toStoredMessageKind(kind: string): StoredMessageKindValue | null {
  if (LOCAL_KIND.has(kind)) return kind as StoredMessageKindValue;
  return null;
}

/** Viewer-relative. Not a remote column. */
export function derivedMessageFrom(senderId: string, viewerId: string): "me" | "them" {
  return senderId === viewerId ? "me" : "them";
}

/**
 * Unread is derived from participant.last_read_at vs last_message_at.
 * Never written as messages.is_unread.
 */
export function derivedUnread(input: {
  lastMessageAt: string | null;
  lastReadAt: string | null;
  lastSenderId?: string | null;
  viewerId: string;
}): boolean {
  if (!input.lastMessageAt) return false;
  if (input.lastSenderId && input.lastSenderId === input.viewerId) return false;
  if (!input.lastReadAt) return true;
  return Date.parse(input.lastMessageAt) > Date.parse(input.lastReadAt);
}

export function toRemoteConversationInsert(
  stored: StoredConversation,
  input: { createdBy: string; kind?: ConversationKind; name?: string | null },
): ConversationInsert {
  return {
    created_by: requireSchemaAUuid(input.createdBy, "conversations.created_by"),
    kind: input.kind ?? "direct",
    name: input.name ?? null,
    last_message_text: stored.lastMessageText,
    last_message_kind: stored.lastMessageType,
    last_message_at: stored.lastMessageText ? epochMsToIso(stored.updatedAt) : null,
  };
}

export function toRemoteParticipantInsert(input: {
  conversationId: string;
  userId: string;
  status?: ParticipantStatus;
  pinned?: boolean;
  lastReadAt?: string | null;
  gestureHandledAt?: number | null;
}): ParticipantInsert {
  return {
    conversation_id: requireSchemaAUuid(
      input.conversationId,
      "conversation_participants.conversation_id",
    ),
    user_id: requireSchemaAUuid(input.userId, "conversation_participants.user_id"),
    status: input.status ?? "accepted",
    pinned: input.pinned ?? false,
    last_read_at: input.lastReadAt ?? null,
    gesture_handled_at:
      typeof input.gestureHandledAt === "number" ? epochMsToIso(input.gestureHandledAt) : null,
  };
}

export function pinnedUserIdsFromParticipants(
  participants: ConversationParticipantRow[],
): string[] {
  return participants.filter((row) => row.pinned).map((row) => row.user_id);
}

export function toStoredConversation(
  row: ConversationRow,
  participants: ConversationParticipantRow[],
  viewerId: string,
): StoredConversation {
  const viewer = participants.find((row) => row.user_id === viewerId);
  const lastKind = row.last_message_kind ? toStoredMessageKind(row.last_message_kind) : null;
  return {
    id: row.id,
    createdAt: isoToEpochMs(row.created_at),
    updatedAt: isoToEpochMs(row.updated_at),
    lastMessageText: row.last_message_text,
    lastMessageType: lastKind,
    pinnedByUserIds: pinnedUserIdsFromParticipants(participants),
    gestureHandledAt: viewer?.gesture_handled_at
      ? isoToEpochMs(viewer.gesture_handled_at)
      : undefined,
  };
}

export function toDomainParticipant(row: ConversationParticipantRow): AdaptedParticipant {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    status: row.status as ParticipantStatus,
    pinned: row.pinned,
    lastReadAt: row.last_read_at,
    gestureHandledAt: row.gesture_handled_at,
    invitedAt: isoToEpochMs(row.invited_at),
    respondedAt: row.responded_at ? isoToEpochMs(row.responded_at) : null,
  };
}

export function toRemoteMessageInsert(message: StoredMessage, senderId: string): MessageInsert {
  return {
    conversation_id: requireSchemaAUuid(message.conversationId, "messages.conversation_id"),
    sender_id: requireSchemaAUuid(senderId, "messages.sender_id"),
    kind: toRemoteMessageKind(message.kind),
    text: message.text,
    created_at: epochMsToIso(message.at),
    payload: message.payload ? payloadToJson(message.payload) : null,
  };
}

function payloadToJson(payload: StoredMessagePayload): Json {
  const json: { [key: string]: Json | undefined } = {};
  if (payload.id !== undefined) json.id = payload.id;
  if (payload.title !== undefined) json.title = payload.title;
  if (payload.cover !== undefined) json.cover = payload.cover;
  if (payload.location !== undefined) json.location = payload.location;
  if (payload.dateText !== undefined) json.dateText = payload.dateText;
  if (payload.proximity !== undefined) json.proximity = payload.proximity;
  if (payload.route !== undefined) json.route = payload.route;
  if (payload.routeType !== undefined) json.routeType = payload.routeType;
  if (payload.dataUrl !== undefined) json.dataUrl = payload.dataUrl;
  if (payload.mediaId !== undefined) json.mediaId = payload.mediaId;
  if (payload.mimeType !== undefined) json.mimeType = payload.mimeType;
  if (payload.fileName !== undefined) json.fileName = payload.fileName;
  if (payload.durationSec !== undefined) json.durationSec = payload.durationSec;
  if (payload.width !== undefined) json.width = payload.width;
  if (payload.height !== undefined) json.height = payload.height;
  return json;
}

function payloadFromJson(value: Json | null): StoredMessagePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const payload: StoredMessagePayload = {};
  if (typeof record.id === "string") payload.id = record.id;
  if (typeof record.title === "string") payload.title = record.title;
  if (typeof record.cover === "string") payload.cover = record.cover;
  if (typeof record.location === "string") payload.location = record.location;
  if (typeof record.dateText === "string") payload.dateText = record.dateText;
  if (typeof record.proximity === "string") payload.proximity = record.proximity;
  if (typeof record.route === "string") payload.route = record.route;
  if (record.routeType === "event" || record.routeType === "place")
    payload.routeType = record.routeType;
  if (typeof record.dataUrl === "string") payload.dataUrl = record.dataUrl;
  if (typeof record.mediaId === "string") payload.mediaId = record.mediaId;
  if (typeof record.mimeType === "string") payload.mimeType = record.mimeType;
  if (typeof record.fileName === "string") payload.fileName = record.fileName;
  if (typeof record.durationSec === "number") payload.durationSec = record.durationSec;
  if (typeof record.width === "number") payload.width = record.width;
  if (typeof record.height === "number") payload.height = record.height;
  return payload;
}

export function toDomainMessage(
  row: MessageRow,
  viewerId: string,
): AdaptedMessage & Pick<StoredMessage, "from"> {
  if ("is_unread" in row || "isUnread" in row) {
    throw new AdapterMappingError(
      "messages.is_unread is not part of Schema A",
      AdapterMappingCode.UNMAPPED_KIND,
      "is_unread",
    );
  }
  const kind = (row.kind || "text") as MessageKind;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    at: isoToEpochMs(row.created_at),
    kind,
    payload: payloadFromJson(row.payload),
    from: derivedMessageFrom(row.sender_id, viewerId),
  };
}

export function toStoredMessage(
  adapted: AdaptedMessage & Pick<StoredMessage, "from">,
): StoredMessage {
  const kind = toStoredMessageKind(adapted.kind);
  if (adapted.kind === "call" && !kind) {
    return {
      id: adapted.id,
      conversationId: adapted.conversationId,
      from: adapted.from,
      senderId: adapted.senderId,
      text: adapted.text,
      at: adapted.at,
      kind: StoredMessageKind.TEXT,
      payload: { ...(adapted.payload ?? {}), title: adapted.payload?.title ?? "call" },
    };
  }
  return {
    id: adapted.id,
    conversationId: adapted.conversationId,
    from: adapted.from,
    senderId: adapted.senderId,
    text: adapted.text,
    at: adapted.at,
    kind: kind ?? StoredMessageKind.TEXT,
    payload: adapted.payload ?? undefined,
  };
}

export function toRemoteGroupConversation(group: DemoGroup): {
  conversation: ConversationInsert;
  participants: ParticipantInsert[];
} {
  const source = optionalSchemaAUuid(group.sourceConversationId);
  return {
    conversation: {
      created_by: requireSchemaAUuid(group.creatorId, "conversations.created_by"),
      kind: "group" satisfies ConversationKind,
      name: group.name,
      source_conversation_id: source,
    },
    participants: group.participants.map((participant) =>
      toRemoteGroupParticipant(group, participant),
    ),
  };
}

function toRemoteGroupParticipant(
  group: DemoGroup,
  participant: DemoGroupParticipant,
): ParticipantInsert {
  return {
    user_id: requireSchemaAUuid(participant.userId, "conversation_participants.user_id"),
    conversation_id: requireSchemaAUuid(group.id, "conversation_participants.conversation_id"),
    status: participant.status,
    invited_at: epochMsToIso(participant.invitedAt),
    responded_at: participant.respondedAt ? epochMsToIso(participant.respondedAt) : null,
  };
}
