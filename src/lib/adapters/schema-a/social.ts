import type { DemoConnection, DemoFollow, DemoRequest } from "@/lib/demo/demo-db";
import { canonicalUserPair } from "@/integrations/supabase/remote/canonical";
import type {
  ConnectionRequestRow,
  ConnectionRow,
  FollowRow,
} from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { epochMsToIso, isoToEpochMs, optionalSchemaAUuid, requireSchemaAUuid } from "./ids";

type FollowInsert = Database["public"]["Tables"]["follows"]["Insert"];
type ConnectionRequestInsert = Database["public"]["Tables"]["connection_requests"]["Insert"];
type ConnectionInsert = Database["public"]["Tables"]["connections"]["Insert"];

export type AdaptedFollow = DemoFollow & { id: string | null };
export type AdaptedConnectionRequest = Omit<DemoRequest, "message"> & {
  /** Schema A 1H-9 has no message column. Local demo still stores one. */
  message: string | null;
};
export type AdaptedConnection = Omit<DemoConnection, "conversationId"> & {
  id: string | null;
  /** Remote FK is optional. Local DemoConnection required a conversation id. */
  conversationId: string | null;
};

export function toRemoteFollowInsert(follow: DemoFollow): FollowInsert {
  return {
    follower_id: requireSchemaAUuid(follow.followerId, "follows.follower_id"),
    followee_id: requireSchemaAUuid(follow.followeeId, "follows.followee_id"),
    created_at: epochMsToIso(follow.createdAt),
  };
}

export function toDomainFollow(row: FollowRow): AdaptedFollow {
  return {
    id: row.id,
    followerId: row.follower_id,
    followeeId: row.followee_id,
    createdAt: isoToEpochMs(row.created_at),
  };
}

export function toRemoteConnectionRequestInsert(request: DemoRequest): ConnectionRequestInsert {
  return {
    from_user_id: requireSchemaAUuid(request.fromUserId, "connection_requests.from_user_id"),
    to_user_id: requireSchemaAUuid(request.toUserId, "connection_requests.to_user_id"),
    status: request.status,
    created_at: epochMsToIso(request.createdAt),
  };
}

export function toDomainConnectionRequest(row: ConnectionRequestRow): AdaptedConnectionRequest {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    message: null,
    status: row.status as DemoRequest["status"],
    createdAt: isoToEpochMs(row.created_at),
  };
}

/**
 * Maps a Connection. Does not create a Conversation.
 * Local demo-direct-* ids are dropped (not UUIDs) instead of being sent as FKs.
 */
export function toRemoteConnectionInsert(connection: DemoConnection): ConnectionInsert {
  const pair = canonicalUserPair(
    requireSchemaAUuid(connection.userAId, "connections.user_a_id"),
    requireSchemaAUuid(connection.userBId, "connections.user_b_id"),
  );
  return {
    ...pair,
    conversation_id: optionalSchemaAUuid(connection.conversationId),
    connected_at: epochMsToIso(connection.connectedAt),
  };
}

export function toDomainConnection(row: ConnectionRow): AdaptedConnection {
  return {
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    conversationId: row.conversation_id,
    connectedAt: isoToEpochMs(row.connected_at),
  };
}
