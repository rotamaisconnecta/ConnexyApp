import { afterEach, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonicalUserPair } from "../src/integrations/supabase/remote/canonical";
import { RemoteErrorCode, RemoteRepositoryError } from "../src/integrations/supabase/remote/errors";
import type {
  ConnectionRequestRow,
  ConnectionRow,
  FollowRow,
} from "../src/integrations/supabase/remote/types";
import { AdapterMappingError } from "../src/lib/adapters/schema-a/errors";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  isRemoteSocialEnabled,
  isSchemaASocialFlagEnabled,
  setRemoteSocialGateForTests,
} from "../src/lib/social/schema-a-social-flag";
import {
  SchemaASocialError,
  SchemaASocialErrorCode,
  createSchemaASocial,
  type SchemaASocialPort,
} from "../src/lib/social/schema-a-social";

const projectRoot = join(import.meta.dir, "..");
const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const NOW = "2026-09-25T00:00:00.000Z";

afterEach(() => {
  setRemoteAuthGateForTests(null);
  setRemoteSocialGateForTests(null);
});

type Graph = {
  follows: FollowRow[];
  requests: ConnectionRequestRow[];
  connections: ConnectionRow[];
};

function emptyGraph(): Graph {
  return { follows: [], requests: [], connections: [] };
}

function memoryPort(uid: string, graph: Graph): { port: SchemaASocialPort; calls: string[] } {
  const calls: string[] = [];
  const port: SchemaASocialPort = {
    async follow(followeeId) {
      calls.push(`follow:${followeeId}`);
      if (uid === followeeId) {
        throw new RemoteRepositoryError("Cannot follow self", RemoteErrorCode.VALIDATION);
      }
      const row: FollowRow = {
        id: crypto.randomUUID(),
        follower_id: uid,
        followee_id: followeeId,
        created_at: NOW,
      };
      graph.follows.push(row);
      return row;
    },
    async unfollow(followeeId) {
      calls.push(`unfollow:${followeeId}`);
      graph.follows = graph.follows.filter(
        (row) => !(row.follower_id === uid && row.followee_id === followeeId),
      );
    },
    async listFollowing(userId) {
      const follower = userId ?? uid;
      calls.push(`listFollowing:${follower}`);
      return graph.follows.filter((row) => row.follower_id === follower);
    },
    async sendRequest(toUserId) {
      calls.push(`sendRequest:${toUserId}`);
      if (uid === toUserId) {
        throw new RemoteRepositoryError(
          "Cannot request connection with self",
          RemoteErrorCode.VALIDATION,
        );
      }
      const existing = graph.requests.find(
        (row) => row.from_user_id === uid && row.to_user_id === toUserId,
      );
      if (existing) {
        if (existing.status === "pending") return existing;
        existing.status = "pending";
        existing.responded_at = null;
        return existing;
      }
      const row: ConnectionRequestRow = {
        id: crypto.randomUUID(),
        from_user_id: uid,
        to_user_id: toUserId,
        status: "pending",
        created_at: NOW,
        updated_at: NOW,
        responded_at: null,
      };
      graph.requests.push(row);
      return row;
    },
    async listOwnRequests() {
      calls.push("listOwnRequests");
      return graph.requests.filter((row) => row.from_user_id === uid || row.to_user_id === uid);
    },
    async getRequest(id) {
      calls.push(`getRequest:${id}`);
      const row = graph.requests.find((item) => item.id === id) ?? null;
      if (!row) return null;
      if (row.from_user_id !== uid && row.to_user_id !== uid) return null;
      return row;
    },
    async acceptRequest(requestId) {
      calls.push(`acceptRequest:${requestId}`);
      const request = graph.requests.find((row) => row.id === requestId);
      if (!request || request.to_user_id !== uid) {
        throw new RemoteRepositoryError(
          "Only the recipient can accept a request",
          RemoteErrorCode.VALIDATION,
        );
      }
      request.status = "accepted";
      request.responded_at = NOW;
      const pair = canonicalUserPair(request.from_user_id, request.to_user_id);
      let connection = graph.connections.find(
        (row) => row.user_a_id === pair.user_a_id && row.user_b_id === pair.user_b_id,
      );
      if (!connection) {
        connection = {
          id: crypto.randomUUID(),
          ...pair,
          conversation_id: null,
          connected_at: NOW,
        };
        graph.connections.push(connection);
      }
      return { request, connection };
    },
    async declineRequest(requestId) {
      calls.push(`declineRequest:${requestId}`);
      const request = graph.requests.find((row) => row.id === requestId);
      if (!request || request.to_user_id !== uid) {
        throw new RemoteRepositoryError(
          "Only the recipient can decline a request",
          RemoteErrorCode.VALIDATION,
        );
      }
      request.status = "declined";
      request.responded_at = NOW;
      return request;
    },
    async getConnectionWith(otherUserId) {
      calls.push(`getConnectionWith:${otherUserId}`);
      const pair = canonicalUserPair(uid, otherUserId);
      const row =
        graph.connections.find(
          (item) => item.user_a_id === pair.user_a_id && item.user_b_id === pair.user_b_id,
        ) ?? null;
      if (!row) return null;
      if (row.user_a_id !== uid && row.user_b_id !== uid) return null;
      return row;
    },
    async listConnections() {
      calls.push("listConnections");
      return graph.connections.filter((row) => row.user_a_id === uid || row.user_b_id === uid);
    },
  };
  return { port, calls };
}

function socialFor(uid: string, graph: Graph, enabled = true) {
  const { port, calls } = memoryPort(uid, graph);
  return {
    calls,
    social: createSchemaASocial({
      isEnabled: () => enabled,
      getIdentity: async () => ({ userId: uid }),
      social: port,
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

describe("1H-18 Social flag", () => {
  test("Demo keeps Social cutover off even if both flags are on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteSocialGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteSocialEnabled()).toBe(false);
    expect(typeof isSchemaASocialFlagEnabled()).toBe("boolean");
  });

  test("Auth on without Social flag keeps Demo Social", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteSocialGateForTests({ isFlagEnabled: () => false });
    expect(isRemoteSocialEnabled()).toBe(false);
  });

  test("Auth + Social flags enable remote Social", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteSocialGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteSocialEnabled()).toBe(true);
  });
});

describe("1H-18 Remote Social", () => {
  test("remote identity is the Auth UUID, not getDemoIdentity()", async () => {
    const graph = emptyGraph();
    const { social } = socialFor(A, graph);
    const identity = await social.getIdentity();
    expect(identity).toEqual({ userId: A });
    expect(identity?.userId).not.toBe(getDemoIdentity().id);
    expect(identity?.userId).not.toBe("lucas");
  });

  test("follow and unfollow persist independently of Connection", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    const followed = await a.social.follow(B);
    expect(followed.followerId).toBe(A);
    expect(followed.followeeId).toBe(B);
    expect(await a.social.isFollowing(B)).toBe(true);
    expect(await a.social.isConnected(B)).toBe(false);
    await a.social.unfollow(B);
    expect(await a.social.isFollowing(B)).toBe(false);
    expect(graph.connections).toEqual([]);
  });

  test("request stays pending until the recipient accepts or declines", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    const b = socialFor(B, graph);
    const sent = await a.social.sendRequest(B);
    expect(sent.fromUserId).toBe(A);
    expect(sent.toUserId).toBe(B);
    expect(sent.status).toBe("pending");
    expect(sent.message).toBeNull();
    expect(await a.social.outgoingPendingTo(B)).not.toBeNull();
    expect(await b.social.incomingPendingFrom(A)).not.toBeNull();
    expect(await a.social.isConnected(B)).toBe(false);
  });

  test("accept persists Connection without conversation_id", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    const b = socialFor(B, graph);
    const sent = await a.social.sendRequest(B);
    const accepted = await b.social.acceptRequest(sent.id);
    expect(accepted.request.status).toBe("accepted");
    expect(accepted.connection.userAId < accepted.connection.userBId).toBe(true);
    expect(accepted.connection.conversationId).toBeNull();
    expect(await a.social.isConnected(B)).toBe(true);
    expect(await b.social.isConnected(A)).toBe(true);
    expect(graph.connections).toHaveLength(1);
    expect(graph.connections[0]?.conversation_id).toBeNull();
  });

  test("recipient can decline without creating a Connection", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    const b = socialFor(B, graph);
    const sent = await a.social.sendRequest(B);
    const declined = await b.social.declineRequest(sent.id);
    expect(declined.status).toBe("declined");
    expect(await a.social.isConnected(B)).toBe(false);
    expect(graph.connections).toEqual([]);
  });

  test("demo ids are rejected on the remote path", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    try {
      await a.social.follow("lucas");
      throw new Error("expected UUID failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
    try {
      await a.social.sendRequest("beatriz");
      throw new Error("expected UUID failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
    expect(graph.follows).toEqual([]);
    expect(graph.requests).toEqual([]);
  });

  test("third party cannot read or accept another pair's request", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    const c = socialFor(C, graph);
    const sent = await a.social.sendRequest(B);
    expect(await c.social.peekRequest(sent.id)).toBeNull();
    try {
      await c.social.acceptRequest(sent.id);
      throw new Error("outsider accept should fail");
    } catch (error) {
      expect(error).toBeInstanceOf(RemoteRepositoryError);
    }
    expect(graph.connections).toEqual([]);
  });

  test("third party cannot list a private Connection", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph);
    const b = socialFor(B, graph);
    const c = socialFor(C, graph);
    const sent = await a.social.sendRequest(B);
    const accepted = await b.social.acceptRequest(sent.id);
    const outsider = await c.social.listConnections();
    expect(outsider.some((row) => row.id === accepted.connection.id)).toBe(false);
  });

  test("disabled Social makes zero repository calls", async () => {
    const graph = emptyGraph();
    const a = socialFor(A, graph, false);
    expect(a.social.isEnabled()).toBe(false);
    expect(await a.social.getIdentity()).toBeNull();
    try {
      await a.social.follow(B);
      throw new Error("expected disabled");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaASocialError);
      expect((error as SchemaASocialError).code).toBe(SchemaASocialErrorCode.DISABLED);
    }
    expect(a.calls).toEqual([]);
  });
});

describe("1H-18 isolation", () => {
  test("remote Social module does not call getDemoIdentity( or create conversations", async () => {
    const text = await readFile(join(projectRoot, "src/lib/social/schema-a-social.ts"), "utf8");
    expect(text.includes("getDemoIdentity(")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
    expect(text.includes("demo-db")).toBe(false);
    expect(text.includes("RemoteConversationRepository")).toBe(false);
    expect(text.includes("ensureLocalConversation")).toBe(false);
  });

  test("other domains are not wired to the Social cutover", async () => {
    const hits: string[] = [];
    const allowed = new Set([
      join(projectRoot, "src/routes/_app.solicitacao.$id.tsx"),
      join(projectRoot, "src/routes/_app.perfil.$id.tsx"),
    ]);
    for (const root of [
      "src/routes",
      "src/components",
      "src/hooks",
      "src/lib/carona",
      "src/lib/catalog",
      "src/lib/reservations",
      "src/lib/reels",
      "src/lib/chat",
      "src/lib/profile",
    ]) {
      for (const file of await walkFiles(join(projectRoot, root))) {
        const text = await readFile(file, "utf8");
        if (text.includes("schema-a-social") && !allowed.has(file)) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  test("demo graph is not imported into Schema A", async () => {
    const social = await readFile(join(projectRoot, "src/lib/social/schema-a-social.ts"), "utf8");
    const flag = await readFile(
      join(projectRoot, "src/lib/social/schema-a-social-flag.ts"),
      "utf8",
    );
    const hook = await readFile(join(projectRoot, "src/lib/social/use-remote-follow.ts"), "utf8");
    for (const text of [social, flag, hook]) {
      expect(text.includes("getDemoIdentity(")).toBe(false);
      expect(text.includes("toggleFollow")).toBe(false);
      expect(text.includes("lucas")).toBe(false);
      expect(text.includes("beatriz")).toBe(false);
    }
  });
});
