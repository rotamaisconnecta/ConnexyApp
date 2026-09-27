import { canonicalUserPair } from "./canonical";
import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError, throwIfPostgrestError } from "./errors";
import { runRemote, unwrapList, unwrapMaybe, unwrapRow } from "./result";
import type {
  ConnectionRequestRow,
  ConnectionRequestStatus,
  ConnectionRow,
  FollowRow,
} from "./types";

export class RemoteSocialRepository {
  constructor(private readonly client: SchemaAClient) {}

  async follow(followeeId: string): Promise<FollowRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (uid === followeeId) {
        throw new RemoteRepositoryError("Cannot follow self", RemoteErrorCode.VALIDATION);
      }
      const result = await this.client
        .from("follows")
        .insert({ follower_id: uid, followee_id: followeeId })
        .select("*")
        .single();
      return unwrapRow(result, "Follow was not created");
    });
  }

  async unfollow(followeeId: string): Promise<void> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client
        .from("follows")
        .delete()
        .eq("follower_id", uid)
        .eq("followee_id", followeeId);
      throwIfPostgrestError(result.error);
    });
  }

  async listFollowing(userId?: string): Promise<FollowRow[]> {
    return runRemote(async () => {
      const uid = userId ?? (await requireAuthUserId(this.client));
      const result = await this.client.from("follows").select("*").eq("follower_id", uid);
      return unwrapList(result);
    });
  }

  async sendRequest(toUserId: string): Promise<ConnectionRequestRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (uid === toUserId) {
        throw new RemoteRepositoryError(
          "Cannot request connection with self",
          RemoteErrorCode.VALIDATION,
        );
      }
      const existing = unwrapMaybe(
        await this.client
          .from("connection_requests")
          .select("*")
          .eq("from_user_id", uid)
          .eq("to_user_id", toUserId)
          .maybeSingle(),
      );
      if (existing) {
        if (existing.status === "pending") return existing;
        const reopened = await this.client
          .from("connection_requests")
          .update({ status: "pending", responded_at: null })
          .eq("id", existing.id)
          .select("*")
          .single();
        return unwrapRow(reopened, "Connection request was not reopened");
      }
      const result = await this.client
        .from("connection_requests")
        .insert({ from_user_id: uid, to_user_id: toUserId, status: "pending" })
        .select("*")
        .single();
      return unwrapRow(result, "Connection request was not created");
    });
  }

  async listOwnRequests(): Promise<ConnectionRequestRow[]> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client
        .from("connection_requests")
        .select("*")
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .order("created_at", { ascending: false });
      return unwrapList(result);
    });
  }

  async getRequest(id: string): Promise<ConnectionRequestRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      const result = await this.client
        .from("connection_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return unwrapMaybe(result);
    });
  }

  /** Accepts a request and upserts Connection. Does not create a Conversation. */
  async acceptRequest(requestId: string): Promise<{
    request: ConnectionRequestRow;
    connection: ConnectionRow;
  }> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const request = unwrapRow(
        await this.client.from("connection_requests").select("*").eq("id", requestId).maybeSingle(),
        "Connection request not found",
      );
      if (request.to_user_id !== uid) {
        throw new RemoteRepositoryError(
          "Only the recipient can accept a request",
          RemoteErrorCode.VALIDATION,
        );
      }
      if (request.status !== "pending") {
        throw new RemoteRepositoryError(
          "Connection request is not pending",
          RemoteErrorCode.VALIDATION,
        );
      }
      const updated = unwrapRow(
        await this.client
          .from("connection_requests")
          .update({
            status: "accepted" satisfies ConnectionRequestStatus,
            responded_at: new Date().toISOString(),
          })
          .eq("id", requestId)
          .select("*")
          .single(),
        "Connection request was not accepted",
      );
      const connection = await this.upsertConnection(request.from_user_id, request.to_user_id);
      return { request: updated, connection };
    });
  }

  async declineRequest(requestId: string): Promise<ConnectionRequestRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const request = unwrapRow(
        await this.client.from("connection_requests").select("*").eq("id", requestId).maybeSingle(),
        "Connection request not found",
      );
      if (request.to_user_id !== uid) {
        throw new RemoteRepositoryError(
          "Only the recipient can decline a request",
          RemoteErrorCode.VALIDATION,
        );
      }
      return unwrapRow(
        await this.client
          .from("connection_requests")
          .update({
            status: "declined" satisfies ConnectionRequestStatus,
            responded_at: new Date().toISOString(),
          })
          .eq("id", requestId)
          .select("*")
          .single(),
        "Connection request was not declined",
      );
    });
  }

  /** Direct Connection without a Request. Does not create a Conversation. */
  async connect(otherUserId: string): Promise<ConnectionRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return this.upsertConnection(uid, otherUserId);
    });
  }

  async getConnectionWith(otherUserId: string): Promise<ConnectionRow | null> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const pair = canonicalUserPair(uid, otherUserId);
      const result = await this.client
        .from("connections")
        .select("*")
        .eq("user_a_id", pair.user_a_id)
        .eq("user_b_id", pair.user_b_id)
        .maybeSingle();
      return unwrapMaybe(result);
    });
  }

  async listConnections(): Promise<ConnectionRow[]> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const result = await this.client
        .from("connections")
        .select("*")
        .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      return unwrapList(result);
    });
  }

  private async upsertConnection(userIdA: string, userIdB: string): Promise<ConnectionRow> {
    const pair = canonicalUserPair(userIdA, userIdB);
    const existing = unwrapMaybe(
      await this.client
        .from("connections")
        .select("*")
        .eq("user_a_id", pair.user_a_id)
        .eq("user_b_id", pair.user_b_id)
        .maybeSingle(),
    );
    if (existing) return existing;
    return unwrapRow(
      await this.client.from("connections").insert(pair).select("*").single(),
      "Connection was not created",
    );
  }
}
