import { afterEach, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { RemoteErrorCode, RemoteRepositoryError } from "../src/integrations/supabase/remote/errors";
import type {
  ConversationParticipantRow,
  ConversationRow,
  MessageKind,
  MessageRow,
} from "../src/integrations/supabase/remote/types";
import { AdapterMappingError } from "../src/lib/adapters/schema-a/errors";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  isRemoteConversationsEnabled,
  isSchemaAConversationsFlagEnabled,
  setRemoteConversationsGateForTests,
} from "../src/lib/chat/schema-a-conversations-flag";
import {
  SchemaAConversationsError,
  SchemaAConversationsErrorCode,
  createSchemaAConversations,
  type SchemaAConversationsPort,
} from "../src/lib/chat/schema-a-conversations";

const projectRoot = join(import.meta.dir, "..");
const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const NOW = "2026-09-25T00:00:00.000Z";
const LATER = "2026-09-25T00:01:00.000Z";

afterEach(() => {
  setRemoteAuthGateForTests(null);
  setRemoteConversationsGateForTests(null);
});

type Graph = {
  conversations: ConversationRow[];
  participants: ConversationParticipantRow[];
  messages: MessageRow[];
};

function emptyGraph(): Graph {
  return { conversations: [], participants: [], messages: [] };
}

function memoryPort(
  uid: string,
  graph: Graph,
): { port: SchemaAConversationsPort; calls: string[] } {
  const calls: string[] = [];

  function isMember(conversationId: string): boolean {
    return graph.participants.some(
      (row) =>
        row.conversation_id === conversationId && row.user_id === uid && row.status === "accepted",
    );
  }

  const port: SchemaAConversationsPort = {
    async createDirect(otherUserId) {
      calls.push(`createDirect:${otherUserId}`);
      if (uid === otherUserId) {
        throw new RemoteRepositoryError(
          "Direct conversation requires two identities",
          RemoteErrorCode.VALIDATION,
        );
      }
      const conversation: ConversationRow = {
        id: crypto.randomUUID(),
        created_by: uid,
        kind: "direct",
        name: null,
        source_conversation_id: null,
        last_message_text: null,
        last_message_kind: null,
        last_message_at: null,
        created_at: NOW,
        updated_at: NOW,
      };
      graph.conversations.push(conversation);
      const selfRow: ConversationParticipantRow = {
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        user_id: uid,
        status: "accepted",
        pinned: false,
        last_read_at: null,
        gesture_handled_at: null,
        invited_at: NOW,
        responded_at: NOW,
        joined_at: NOW,
        created_at: NOW,
      };
      const otherRow: ConversationParticipantRow = {
        ...selfRow,
        id: crypto.randomUUID(),
        user_id: otherUserId,
      };
      graph.participants.push(selfRow, otherRow);
      return { conversation, participants: [selfRow, otherRow] };
    },
    async get(id) {
      calls.push(`get:${id}`);
      if (!isMember(id)) return null;
      return graph.conversations.find((row) => row.id === id) ?? null;
    },
    async listMine() {
      calls.push("listMine");
      const ids = new Set(
        graph.participants.filter((row) => row.user_id === uid).map((row) => row.conversation_id),
      );
      return graph.conversations.filter((row) => ids.has(row.id));
    },
    async listParticipants(conversationId) {
      calls.push(`listParticipants:${conversationId}`);
      if (!isMember(conversationId)) return [];
      return graph.participants.filter((row) => row.conversation_id === conversationId);
    },
    async getOwnParticipant(conversationId) {
      calls.push(`getOwnParticipant:${conversationId}`);
      return (
        graph.participants.find(
          (row) => row.conversation_id === conversationId && row.user_id === uid,
        ) ?? null
      );
    },
    async setPinned(conversationId, pinned) {
      calls.push(`setPinned:${conversationId}:${pinned}`);
      const row = graph.participants.find(
        (item) => item.conversation_id === conversationId && item.user_id === uid,
      );
      if (!row) {
        throw new RemoteRepositoryError("Participant not found", RemoteErrorCode.NOT_FOUND);
      }
      row.pinned = pinned;
      return row;
    },
    async markRead(conversationId, at = NOW) {
      calls.push(`markRead:${conversationId}`);
      const row = graph.participants.find(
        (item) => item.conversation_id === conversationId && item.user_id === uid,
      );
      if (!row) {
        throw new RemoteRepositoryError("Participant not found", RemoteErrorCode.NOT_FOUND);
      }
      row.last_read_at = at;
      return row;
    },
    async sendMessage(input) {
      calls.push(`sendMessage:${input.conversationId}`);
      if (!isMember(input.conversationId)) {
        throw new RemoteRepositoryError("Not a participant", RemoteErrorCode.RLS);
      }
      const kind = (input.kind ?? "text") as MessageKind;
      const message: MessageRow = {
        id: crypto.randomUUID(),
        conversation_id: input.conversationId,
        sender_id: uid,
        kind,
        text: input.text,
        payload: null,
        media_bucket: null,
        media_path: null,
        media_mime: null,
        media_duration_ms: null,
        shared_entity_id: null,
        shared_entity_type: null,
        created_at: LATER,
        edited_at: null,
        deleted_at: null,
      };
      graph.messages.push(message);
      const conversation = graph.conversations.find((row) => row.id === input.conversationId);
      if (conversation) {
        conversation.last_message_text = input.text;
        conversation.last_message_kind = kind;
        conversation.last_message_at = message.created_at;
        conversation.updated_at = message.created_at;
      }
      return message;
    },
    async listMessages(conversationId) {
      calls.push(`listMessages:${conversationId}`);
      if (!isMember(conversationId)) return [];
      return graph.messages.filter((row) => row.conversation_id === conversationId);
    },
  };
  return { port, calls };
}

function chatFor(uid: string, graph: Graph, enabled = true) {
  const { port, calls } = memoryPort(uid, graph);
  return {
    calls,
    chat: createSchemaAConversations({
      isEnabled: () => enabled,
      getIdentity: async () => ({ userId: uid }),
      conversations: port,
    }),
  };
}

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

describe("1H-19 Conversations flag", () => {
  test("Demo keeps Conversations cutover off even if both flags are on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteConversationsGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteConversationsEnabled()).toBe(false);
    expect(typeof isSchemaAConversationsFlagEnabled()).toBe("boolean");
  });

  test("Auth on without Conversations flag keeps Demo Chat", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteConversationsGateForTests({ isFlagEnabled: () => false });
    expect(isRemoteConversationsEnabled()).toBe(false);
  });

  test("Auth + Conversations flags enable remote Chat", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteConversationsGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteConversationsEnabled()).toBe(true);
  });
});

describe("1H-19 Remote Conversations", () => {
  test("remote identity is the Auth UUID, not getDemoIdentity()", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    const identity = await a.chat.getIdentity();
    expect(identity).toEqual({ userId: A });
    expect(identity?.userId).not.toBe(getDemoIdentity().id);
  });

  test("createDirect persists explicit participants", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    const thread = await a.chat.createDirect(B);
    expect(thread.conversation.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(thread.participants).toHaveLength(2);
    expect(thread.participants.map((item) => item.userId).sort()).toEqual([A, B].sort());
    expect(thread.participants.every((item) => item.status === "accepted")).toBe(true);
    expect(thread.peerId).toBe(B);
  });

  test("send and list messages use sender Auth UUID and text", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    const b = chatFor(B, graph);
    const thread = await a.chat.createDirect(B);
    const sent = await a.chat.sendMessage(thread.conversation.id, "oi schema a");
    expect(sent.senderId).toBe(A);
    expect(sent.text).toBe("oi schema a");
    expect(sent.from).toBe("me");
    expect("isUnread" in sent).toBe(false);
    const listed = await b.chat.listMessages(thread.conversation.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.from).toBe("them");
    expect(listed[0]?.senderId).toBe(A);
  });

  test("pin is per participant and does not leak to the peer", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    const b = chatFor(B, graph);
    const thread = await a.chat.createDirect(B);
    await a.chat.setPinned(thread.conversation.id, true);
    const aThread = await a.chat.getThread(thread.conversation.id);
    const bThread = await b.chat.getThread(thread.conversation.id);
    expect(aThread?.pinned).toBe(true);
    expect(bThread?.pinned).toBe(false);
  });

  test("unread is derived from last_read_at and markRead is isolated", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    const b = chatFor(B, graph);
    const thread = await a.chat.createDirect(B);
    await a.chat.sendMessage(thread.conversation.id, "ping");
    const before = await b.chat.getThread(thread.conversation.id);
    expect(before?.unread).toBe(true);
    expect(before?.own?.lastReadAt).toBeNull();
    const aAfterSend = await a.chat.getThread(thread.conversation.id);
    const evenLater = "2026-09-25T00:02:00.000Z";
    await b.chat.markRead(thread.conversation.id, evenLater);
    const afterB = await b.chat.getThread(thread.conversation.id);
    const afterA = await a.chat.getThread(thread.conversation.id);
    expect(afterB?.unread).toBe(false);
    expect(afterB?.own?.lastReadAt).toBe(evenLater);
    expect(afterA?.own?.lastReadAt).toBe(aAfterSend?.own?.lastReadAt);
  });

  test("outsider cannot read conversation or messages", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    const c = chatFor(C, graph);
    const thread = await a.chat.createDirect(B);
    expect(await c.chat.getThread(thread.conversation.id)).toBeNull();
    expect(await c.chat.listMessages(thread.conversation.id)).toEqual([]);
    expect(await c.chat.listThreads()).toEqual([]);
  });

  test("demo ids are rejected and IndexedDB is not imported", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph);
    try {
      await a.chat.createDirect("lucas");
      throw new Error("expected UUID failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
    expect(graph.conversations).toEqual([]);
  });

  test("disabled Conversations makes zero repository calls", async () => {
    const graph = emptyGraph();
    const a = chatFor(A, graph, false);
    expect(a.chat.isEnabled()).toBe(false);
    expect(await a.chat.getIdentity()).toBeNull();
    try {
      await a.chat.createDirect(B);
      throw new Error("expected disabled");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaAConversationsError);
      expect((error as SchemaAConversationsError).code).toBe(
        SchemaAConversationsErrorCode.DISABLED,
      );
    }
    expect(a.calls).toEqual([]);
  });
});

describe("1H-19 isolation", () => {
  test("remote Conversations module does not call getDemoIdentity( or ChatRepository", async () => {
    const text = await readFile(
      join(projectRoot, "src/lib/chat/schema-a-conversations.ts"),
      "utf8",
    );
    expect(text.includes("getDemoIdentity(")).toBe(false);
    expect(text.includes("ChatRepository")).toBe(false);
    expect(text.includes("chat.repository")).toBe(false);
    expect(text.includes("demo-db")).toBe(false);
    expect(text.includes("schema-a-social")).toBe(false);
    expect(text.includes("ensureLocalConversation")).toBe(false);
  });

  test("other domains are not wired to the Conversations cutover", async () => {
    const hits: string[] = [];
    const allowed = new Set([
      join(projectRoot, "src/hooks/api/use-chat.ts"),
      join(projectRoot, "src/components/chat/conversations-screen.tsx"),
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      join(projectRoot, "src/components/chat/conversation-invite-button.tsx"),
    ]);
    for (const root of [
      "src/routes",
      "src/components",
      "src/hooks",
      "src/lib/carona",
      "src/lib/catalog",
      "src/lib/reservations",
      "src/lib/reels",
      "src/lib/social",
      "src/lib/profile",
    ]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-conversations") && !allowed.has(file)) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
