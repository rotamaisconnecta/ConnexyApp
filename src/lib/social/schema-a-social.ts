import {
  toDomainConnection,
  toDomainConnectionRequest,
  toDomainFollow,
  type AdaptedConnection,
  type AdaptedConnectionRequest,
  type AdaptedFollow,
} from "@/lib/adapters/schema-a/social";
import { isSchemaAUuid, requireSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import { toSchemaAAuthIdentity, type SchemaAAuthIdentity } from "@/lib/adapters/schema-a/identity";
import type {
  ConnectionRequestRow,
  ConnectionRow,
  FollowRow,
} from "@/integrations/supabase/remote/types";
import { isRemoteSocialEnabled } from "./schema-a-social-flag";

export type RemoteSocialIdentity = SchemaAAuthIdentity;

export const SchemaASocialErrorCode = {
  DISABLED: "DISABLED",
  NO_SESSION: "NO_SESSION",
  IDENTITY: "IDENTITY",
} as const;

export type SchemaASocialErrorCodeValue =
  (typeof SchemaASocialErrorCode)[keyof typeof SchemaASocialErrorCode];

export class SchemaASocialError extends Error {
  readonly code: SchemaASocialErrorCodeValue;

  constructor(message: string, code: SchemaASocialErrorCodeValue) {
    super(message);
    this.name = "SchemaASocialError";
    this.code = code;
  }
}

export type SchemaASocialPort = {
  follow: (followeeId: string) => Promise<FollowRow>;
  unfollow: (followeeId: string) => Promise<void>;
  listFollowing: (userId?: string) => Promise<FollowRow[]>;
  sendRequest: (toUserId: string) => Promise<ConnectionRequestRow>;
  listOwnRequests: () => Promise<ConnectionRequestRow[]>;
  getRequest: (id: string) => Promise<ConnectionRequestRow | null>;
  acceptRequest: (
    requestId: string,
  ) => Promise<{ request: ConnectionRequestRow; connection: ConnectionRow }>;
  declineRequest: (requestId: string) => Promise<ConnectionRequestRow>;
  getConnectionWith: (otherUserId: string) => Promise<ConnectionRow | null>;
  listConnections: () => Promise<ConnectionRow[]>;
};

export type SchemaASocialDeps = {
  isEnabled: () => boolean;
  getIdentity: () => Promise<RemoteSocialIdentity | null>;
  social: SchemaASocialPort;
};

export function createSchemaASocial(deps: SchemaASocialDeps) {
  async function requireIdentity(): Promise<RemoteSocialIdentity> {
    if (!deps.isEnabled()) {
      throw new SchemaASocialError("Schema A Social is disabled", SchemaASocialErrorCode.DISABLED);
    }
    const identity = await deps.getIdentity();
    if (!identity) {
      throw new SchemaASocialError("No remote Auth session", SchemaASocialErrorCode.NO_SESSION);
    }
    return toSchemaAAuthIdentity(identity.userId);
  }

  function requirePeer(peerId: string, field: string): string {
    return requireSchemaAUuid(peerId, field);
  }

  return {
    isEnabled(): boolean {
      return deps.isEnabled();
    },

    async getIdentity(): Promise<RemoteSocialIdentity | null> {
      if (!deps.isEnabled()) return null;
      const identity = await deps.getIdentity();
      return identity ? toSchemaAAuthIdentity(identity.userId) : null;
    },

    async follow(followeeId: string): Promise<AdaptedFollow> {
      await requireIdentity();
      const row = await deps.social.follow(requirePeer(followeeId, "followeeId"));
      return toDomainFollow(row);
    },

    async unfollow(followeeId: string): Promise<void> {
      await requireIdentity();
      await deps.social.unfollow(requirePeer(followeeId, "followeeId"));
    },

    async isFollowing(followeeId: string): Promise<boolean> {
      const identity = await requireIdentity();
      const peer = requirePeer(followeeId, "followeeId");
      const rows = await deps.social.listFollowing(identity.userId);
      return rows.some((row) => row.followee_id === peer);
    },

    async sendRequest(toUserId: string): Promise<AdaptedConnectionRequest> {
      await requireIdentity();
      const row = await deps.social.sendRequest(requirePeer(toUserId, "toUserId"));
      return toDomainConnectionRequest(row);
    },

    async incomingPendingFrom(fromUserId: string): Promise<AdaptedConnectionRequest | null> {
      const identity = await requireIdentity();
      const peer = requirePeer(fromUserId, "fromUserId");
      const rows = await deps.social.listOwnRequests();
      const pending = rows.find(
        (row) =>
          row.from_user_id === peer &&
          row.to_user_id === identity.userId &&
          row.status === "pending",
      );
      return pending ? toDomainConnectionRequest(pending) : null;
    },

    async outgoingPendingTo(toUserId: string): Promise<AdaptedConnectionRequest | null> {
      const identity = await requireIdentity();
      const peer = requirePeer(toUserId, "toUserId");
      const rows = await deps.social.listOwnRequests();
      const pending = rows.find(
        (row) =>
          row.from_user_id === identity.userId &&
          row.to_user_id === peer &&
          row.status === "pending",
      );
      return pending ? toDomainConnectionRequest(pending) : null;
    },

    async acceptRequest(requestId: string): Promise<{
      request: AdaptedConnectionRequest;
      connection: AdaptedConnection;
    }> {
      await requireIdentity();
      const accepted = await deps.social.acceptRequest(requirePeer(requestId, "requestId"));
      return {
        request: toDomainConnectionRequest(accepted.request),
        connection: toDomainConnection(accepted.connection),
      };
    },

    async declineRequest(requestId: string): Promise<AdaptedConnectionRequest> {
      await requireIdentity();
      const row = await deps.social.declineRequest(requirePeer(requestId, "requestId"));
      return toDomainConnectionRequest(row);
    },

    async isConnected(otherUserId: string): Promise<boolean> {
      await requireIdentity();
      const row = await deps.social.getConnectionWith(requirePeer(otherUserId, "otherUserId"));
      return row != null;
    },

    async listConnections(): Promise<AdaptedConnection[]> {
      await requireIdentity();
      const rows = await deps.social.listConnections();
      return rows.map(toDomainConnection);
    },

    async peekRequest(requestId: string): Promise<AdaptedConnectionRequest | null> {
      await requireIdentity();
      const row = await deps.social.getRequest(requirePeer(requestId, "requestId"));
      return row ? toDomainConnectionRequest(row) : null;
    },
  };
}

export type SchemaASocial = ReturnType<typeof createSchemaASocial>;

let cachedDefault: SchemaASocial | null = null;

async function productionSocialPort(): Promise<SchemaASocialPort> {
  const url = import.meta.env.VITE_APP_SUPABASE_URL;
  const key = import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY;
  const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
  const identity = await getSchemaAAuth().getIdentity();
  if (!identity) {
    throw new SchemaASocialError("No remote Auth session", SchemaASocialErrorCode.NO_SESSION);
  }
  const { supabase } = await import("@/lib/supabase/client");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    throw new SchemaASocialError("No remote Auth session", SchemaASocialErrorCode.NO_SESSION);
  }
  const { createSchemaAClient } = await import("@/integrations/supabase/remote/client");
  const { RemoteSocialRepository } =
    await import("@/integrations/supabase/remote/social.repository");
  const client = createSchemaAClient(url, key, { accessToken: token });
  return new RemoteSocialRepository(client);
}

function lazySocialPort(): SchemaASocialPort {
  let portPromise: Promise<SchemaASocialPort> | null = null;
  const port = () => (portPromise ??= productionSocialPort());
  return {
    async follow(followeeId) {
      return (await port()).follow(followeeId);
    },
    async unfollow(followeeId) {
      return (await port()).unfollow(followeeId);
    },
    async listFollowing(userId) {
      return (await port()).listFollowing(userId);
    },
    async sendRequest(toUserId) {
      return (await port()).sendRequest(toUserId);
    },
    async listOwnRequests() {
      return (await port()).listOwnRequests();
    },
    async getRequest(id) {
      return (await port()).getRequest(id);
    },
    async acceptRequest(requestId) {
      return (await port()).acceptRequest(requestId);
    },
    async declineRequest(requestId) {
      return (await port()).declineRequest(requestId);
    },
    async getConnectionWith(otherUserId) {
      return (await port()).getConnectionWith(otherUserId);
    },
    async listConnections() {
      return (await port()).listConnections();
    },
  };
}

export function getSchemaASocial(): SchemaASocial {
  if (cachedDefault) return cachedDefault;
  cachedDefault = createSchemaASocial({
    isEnabled: isRemoteSocialEnabled,
    async getIdentity() {
      const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
      return getSchemaAAuth().getIdentity();
    },
    social: lazySocialPort(),
  });
  return cachedDefault;
}

export function resetSchemaASocialSingletonForTests(): void {
  cachedDefault = null;
}

export function canRemoteSocialTarget(peerId: string): boolean {
  return isRemoteSocialEnabled() && isSchemaAUuid(peerId);
}
