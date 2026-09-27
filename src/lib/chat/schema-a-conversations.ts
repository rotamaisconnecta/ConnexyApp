import {
  derivedUnread,
  toDomainMessage,
  toDomainParticipant,
  type AdaptedConversation,
  type AdaptedMessage,
  type AdaptedParticipant,
} from "@/lib/adapters/schema-a/conversation";
import { isoToEpochMs, isSchemaAUuid, requireSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import { toSchemaAAuthIdentity, type SchemaAAuthIdentity } from "@/lib/adapters/schema-a/identity";
import type {
  ConversationKind,
  ConversationParticipantRow,
  ConversationRow,
  MessageKind,
  MessageRow,
} from "@/integrations/supabase/remote/types";
import { isRemoteConversationsEnabled } from "./schema-a-conversations-flag";

export type RemoteConversationsIdentity = SchemaAAuthIdentity;

export const SchemaAConversationsErrorCode = {
  DISABLED: "DISABLED",
  NO_SESSION: "NO_SESSION",
  IDENTITY: "IDENTITY",
} as const;

export type SchemaAConversationsErrorCodeValue =
  (typeof SchemaAConversationsErrorCode)[keyof typeof SchemaAConversationsErrorCode];

export class SchemaAConversationsError extends Error {
  readonly code: SchemaAConversationsErrorCodeValue;

  constructor(message: string, code: SchemaAConversationsErrorCodeValue) {
    super(message);
    this.name = "SchemaAConversationsError";
    this.code = code;
  }
}

export type SchemaAConversationsPort = {
  createDirect: (otherUserId: string) => Promise<{
    conversation: ConversationRow;
    participants: ConversationParticipantRow[];
  }>;
  get: (id: string) => Promise<ConversationRow | null>;
  listMine: () => Promise<ConversationRow[]>;
  listParticipants: (conversationId: string) => Promise<ConversationParticipantRow[]>;
  getOwnParticipant: (conversationId: string) => Promise<ConversationParticipantRow | null>;
  setPinned: (conversationId: string, pinned: boolean) => Promise<ConversationParticipantRow>;
  markRead: (conversationId: string, at?: string) => Promise<ConversationParticipantRow>;
  sendMessage: (input: {
    conversationId: string;
    text: string;
    kind?: MessageKind;
  }) => Promise<MessageRow>;
  listMessages: (conversationId: string) => Promise<MessageRow[]>;
};

export type SchemaAConversationsDeps = {
  isEnabled: () => boolean;
  getIdentity: () => Promise<RemoteConversationsIdentity | null>;
  conversations: SchemaAConversationsPort;
};

export type RemoteConversationThread = {
  conversation: AdaptedConversation & { lastMessageAt: string | null };
  participants: AdaptedParticipant[];
  own: AdaptedParticipant | null;
  peerId: string | null;
  pinned: boolean;
  unread: boolean;
};

function toAdaptedConversation(
  row: ConversationRow,
): AdaptedConversation & { lastMessageAt: string | null } {
  return {
    id: row.id,
    createdBy: row.created_by,
    kind: row.kind as ConversationKind,
    name: row.name,
    sourceConversationId: row.source_conversation_id,
    createdAt: isoToEpochMs(row.created_at),
    updatedAt: isoToEpochMs(row.updated_at),
    lastMessageText: row.last_message_text,
    lastMessageKind: (row.last_message_kind as MessageKind | null) ?? null,
    lastMessageAt: row.last_message_at,
  };
}

function assembleThread(
  row: ConversationRow,
  participants: ConversationParticipantRow[],
  viewerId: string,
): RemoteConversationThread {
  const adaptedParticipants = participants.map(toDomainParticipant);
  const own = adaptedParticipants.find((item) => item.userId === viewerId) ?? null;
  const peer = adaptedParticipants.find((item) => item.userId !== viewerId) ?? null;
  return {
    conversation: toAdaptedConversation(row),
    participants: adaptedParticipants,
    own,
    peerId: peer?.userId ?? null,
    pinned: own?.pinned ?? false,
    unread: derivedUnread({
      lastMessageAt: row.last_message_at,
      lastReadAt: own?.lastReadAt ?? null,
      viewerId,
    }),
  };
}

export function createSchemaAConversations(deps: SchemaAConversationsDeps) {
  async function requireIdentity(): Promise<RemoteConversationsIdentity> {
    if (!deps.isEnabled()) {
      throw new SchemaAConversationsError(
        "Schema A Conversations is disabled",
        SchemaAConversationsErrorCode.DISABLED,
      );
    }
    const identity = await deps.getIdentity();
    if (!identity) {
      throw new SchemaAConversationsError(
        "No remote Auth session",
        SchemaAConversationsErrorCode.NO_SESSION,
      );
    }
    return toSchemaAAuthIdentity(identity.userId);
  }

  function requireId(value: string, field: string): string {
    return requireSchemaAUuid(value, field);
  }

  async function listThreadsFor(viewerId: string): Promise<RemoteConversationThread[]> {
    const rows = await deps.conversations.listMine();
    const threads: RemoteConversationThread[] = [];
    for (const row of rows) {
      const participants = await deps.conversations.listParticipants(row.id);
      if (!participants.some((item) => item.user_id === viewerId)) continue;
      threads.push(assembleThread(row, participants, viewerId));
    }
    return threads;
  }

  return {
    isEnabled(): boolean {
      return deps.isEnabled();
    },

    async getIdentity(): Promise<RemoteConversationsIdentity | null> {
      if (!deps.isEnabled()) return null;
      const identity = await deps.getIdentity();
      return identity ? toSchemaAAuthIdentity(identity.userId) : null;
    },

    async createDirect(otherUserId: string): Promise<RemoteConversationThread> {
      const identity = await requireIdentity();
      const created = await deps.conversations.createDirect(requireId(otherUserId, "otherUserId"));
      return assembleThread(created.conversation, created.participants, identity.userId);
    },

    async getThread(conversationId: string): Promise<RemoteConversationThread | null> {
      const identity = await requireIdentity();
      const row = await deps.conversations.get(requireId(conversationId, "conversationId"));
      if (!row) return null;
      const participants = await deps.conversations.listParticipants(row.id);
      if (!participants.some((item) => item.user_id === identity.userId)) return null;
      return assembleThread(row, participants, identity.userId);
    },

    async listThreads(): Promise<RemoteConversationThread[]> {
      const identity = await requireIdentity();
      return listThreadsFor(identity.userId);
    },

    async findDirectWith(otherUserId: string): Promise<RemoteConversationThread | null> {
      const identity = await requireIdentity();
      const peer = requireId(otherUserId, "otherUserId");
      const threads = await listThreadsFor(identity.userId);
      return (
        threads.find((thread) => {
          if (thread.conversation.kind !== "direct") return false;
          const ids = thread.participants.map((item) => item.userId);
          return ids.includes(identity.userId) && ids.includes(peer) && ids.length === 2;
        }) ?? null
      );
    },

    async listMessages(conversationId: string): Promise<(AdaptedMessage & { from: "me" | "them" })[]> {
      const identity = await requireIdentity();
      const rows = await deps.conversations.listMessages(
        requireId(conversationId, "conversationId"),
      );
      return rows.map((row) => toDomainMessage(row, identity.userId));
    },

    async sendMessage(
      conversationId: string,
      text: string,
    ): Promise<AdaptedMessage & { from: "me" | "them" }> {
      const identity = await requireIdentity();
      const trimmed = text.trim();
      const row = await deps.conversations.sendMessage({
        conversationId: requireId(conversationId, "conversationId"),
        text: trimmed,
        kind: "text",
      });
      await deps.conversations.markRead(conversationId, row.created_at);
      return toDomainMessage(row, identity.userId);
    },

    async setPinned(conversationId: string, pinned: boolean): Promise<AdaptedParticipant> {
      await requireIdentity();
      const row = await deps.conversations.setPinned(
        requireId(conversationId, "conversationId"),
        pinned,
      );
      return toDomainParticipant(row);
    },

    async markRead(conversationId: string, at?: string): Promise<AdaptedParticipant> {
      await requireIdentity();
      const row = await deps.conversations.markRead(
        requireId(conversationId, "conversationId"),
        at,
      );
      return toDomainParticipant(row);
    },
  };
}

export type SchemaAConversations = ReturnType<typeof createSchemaAConversations>;

let cachedDefault: SchemaAConversations | null = null;

async function productionConversationsPort(): Promise<SchemaAConversationsPort> {
  const url = import.meta.env.VITE_APP_SUPABASE_URL;
  const key = import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY;
  const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
  const identity = await getSchemaAAuth().getIdentity();
  if (!identity) {
    throw new SchemaAConversationsError(
      "No remote Auth session",
      SchemaAConversationsErrorCode.NO_SESSION,
    );
  }
  const { supabase } = await import("@/lib/supabase/client");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    throw new SchemaAConversationsError(
      "No remote Auth session",
      SchemaAConversationsErrorCode.NO_SESSION,
    );
  }
  const { createSchemaAClient } = await import("@/integrations/supabase/remote/client");
  const { RemoteConversationRepository } =
    await import("@/integrations/supabase/remote/conversation.repository");
  const client = createSchemaAClient(url, key, { accessToken: token });
  return new RemoteConversationRepository(client);
}

function lazyConversationsPort(): SchemaAConversationsPort {
  let portPromise: Promise<SchemaAConversationsPort> | null = null;
  const port = () => (portPromise ??= productionConversationsPort());
  return {
    async createDirect(otherUserId) {
      return (await port()).createDirect(otherUserId);
    },
    async get(id) {
      return (await port()).get(id);
    },
    async listMine() {
      return (await port()).listMine();
    },
    async listParticipants(conversationId) {
      return (await port()).listParticipants(conversationId);
    },
    async getOwnParticipant(conversationId) {
      return (await port()).getOwnParticipant(conversationId);
    },
    async setPinned(conversationId, pinned) {
      return (await port()).setPinned(conversationId, pinned);
    },
    async markRead(conversationId, at) {
      return (await port()).markRead(conversationId, at);
    },
    async sendMessage(input) {
      return (await port()).sendMessage(input);
    },
    async listMessages(conversationId) {
      return (await port()).listMessages(conversationId);
    },
  };
}

export function getSchemaAConversations(): SchemaAConversations {
  if (cachedDefault) return cachedDefault;
  cachedDefault = createSchemaAConversations({
    isEnabled: isRemoteConversationsEnabled,
    async getIdentity() {
      const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
      return getSchemaAAuth().getIdentity();
    },
    conversations: lazyConversationsPort(),
  });
  return cachedDefault;
}

export function resetSchemaAConversationsSingletonForTests(): void {
  cachedDefault = null;
}

export function canRemoteConversationTarget(peerId: string): boolean {
  return isRemoteConversationsEnabled() && isSchemaAUuid(peerId);
}
