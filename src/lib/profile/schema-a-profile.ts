import { toSchemaAAuthIdentity, type SchemaAAuthIdentity } from "@/lib/adapters/schema-a/identity";
import {
  toDomainProfile,
  toRemoteProfilePrivateUpdate,
  toRemoteProfileUpdate,
} from "@/lib/adapters/schema-a/profile";
import { isSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import type { OwnProfilePatch } from "@/integrations/supabase/remote/profile.repository";
import type {
  ProfilePrivateRow,
  ProfilePrivateUpdate,
  ProfileRow,
} from "@/integrations/supabase/remote/types";
import type { DemoOwnProfile } from "@/lib/demo/demo-own-profile";
import { isRemoteProfileEnabled } from "./schema-a-profile-flag";

export type RemoteProfileIdentity = SchemaAAuthIdentity;

export const SchemaAProfileErrorCode = {
  DISABLED: "DISABLED",
  NO_SESSION: "NO_SESSION",
  IDENTITY: "IDENTITY",
} as const;

export type SchemaAProfileErrorCodeValue =
  (typeof SchemaAProfileErrorCode)[keyof typeof SchemaAProfileErrorCode];

export class SchemaAProfileError extends Error {
  readonly code: SchemaAProfileErrorCodeValue;

  constructor(message: string, code: SchemaAProfileErrorCodeValue) {
    super(message);
    this.name = "SchemaAProfileError";
    this.code = code;
  }
}

export type SchemaAProfilePort = {
  getOwn: () => Promise<ProfileRow>;
  updateOwn: (patch: OwnProfilePatch) => Promise<ProfileRow>;
  getOwnPrivate: () => Promise<ProfilePrivateRow>;
  getPrivateByUserId: (userId: string) => Promise<ProfilePrivateRow | null>;
  updateOwnPrivate: (patch: Omit<ProfilePrivateUpdate, "user_id">) => Promise<ProfilePrivateRow>;
};

export type SchemaAProfileDeps = {
  isEnabled: () => boolean;
  getIdentity: () => Promise<RemoteProfileIdentity | null>;
  profiles: SchemaAProfilePort;
};

const TRIGGER_HANDLE = /^u[0-9a-f]{16}$/i;

export function isLocalMediaUrl(value: string | undefined): boolean {
  return Boolean(value && (value.startsWith("data:") || value.startsWith("blob:")));
}

/** Fields the 1H-12 adapter can write. Photo/cover data URLs stay out. */
export function mappedProfileForRemote(profile: DemoOwnProfile): DemoOwnProfile {
  return {
    name: profile.name,
    handle: profile.handle,
    photo: isLocalMediaUrl(profile.photo) ? "" : profile.photo,
    cover: isLocalMediaUrl(profile.cover) ? "" : profile.cover,
    city: profile.city,
    bio: profile.bio,
    interests: profile.interests,
    privateAddresses: {
      home: profile.privateAddresses.home,
      work: profile.privateAddresses.work,
    },
    visibility: profile.visibility,
    age: profile.age,
    birthDate: profile.birthDate,
    identityId: profile.identityId,
  };
}

/**
 * Copy-once is allowed only when the local blob is already owned by the Auth UUID.
 * `lucas` and other demo ids never copy.
 */
export function isCopyOnceEligible(local: DemoOwnProfile, remoteUserId: string): boolean {
  if (!isSchemaAUuid(remoteUserId)) return false;
  return local.identityId === remoteUserId;
}

export function createSchemaAProfile(deps: SchemaAProfileDeps) {
  async function requireIdentity(): Promise<RemoteProfileIdentity> {
    if (!deps.isEnabled()) {
      throw new SchemaAProfileError(
        "Schema A Profile is disabled",
        SchemaAProfileErrorCode.DISABLED,
      );
    }
    const identity = await deps.getIdentity();
    if (!identity) {
      throw new SchemaAProfileError("No remote Auth session", SchemaAProfileErrorCode.NO_SESSION);
    }
    if (!isSchemaAUuid(identity.userId)) {
      throw new SchemaAProfileError(
        "Remote profile identity is not a UUID",
        SchemaAProfileErrorCode.IDENTITY,
      );
    }
    return identity;
  }

  return {
    isEnabled(): boolean {
      return deps.isEnabled();
    },

    async getIdentity(): Promise<RemoteProfileIdentity | null> {
      if (!deps.isEnabled()) return null;
      const identity = await deps.getIdentity();
      return identity ? toSchemaAAuthIdentity(identity.userId) : null;
    },

    async loadOwn(): Promise<DemoOwnProfile> {
      const identity = await requireIdentity();
      const publicRow = await deps.profiles.getOwn();
      if (publicRow.id !== identity.userId) {
        throw new SchemaAProfileError(
          "profiles.id must equal auth.user.id",
          SchemaAProfileErrorCode.IDENTITY,
        );
      }
      const privateRow = await deps.profiles.getOwnPrivate();
      if (privateRow.user_id !== identity.userId) {
        throw new SchemaAProfileError(
          "profile_private.user_id must equal auth.user.id",
          SchemaAProfileErrorCode.IDENTITY,
        );
      }
      const domain = toDomainProfile(publicRow, privateRow);
      return { ...domain, identityId: identity.userId };
    },

    async saveOwn(profile: DemoOwnProfile): Promise<DemoOwnProfile> {
      const identity = await requireIdentity();
      const mapped = mappedProfileForRemote({ ...profile, identityId: identity.userId });
      const publicPatch = toRemoteProfileUpdate(mapped);
      if (isLocalMediaUrl(profile.photo)) delete publicPatch.photo_url;
      if (isLocalMediaUrl(profile.cover)) delete publicPatch.cover_url;
      if (Object.keys(publicPatch).length > 0) {
        await deps.profiles.updateOwn(publicPatch);
      }
      await deps.profiles.updateOwnPrivate(toRemoteProfilePrivateUpdate(mapped));
      return this.loadOwn();
    },

    async copyMappedFieldsOnce(local: DemoOwnProfile): Promise<"copied" | "skipped"> {
      const identity = await requireIdentity();
      if (!isCopyOnceEligible(local, identity.userId)) return "skipped";
      const remote = await this.loadOwn();
      if (!TRIGGER_HANDLE.test(remote.handle)) return "skipped";
      const mapped = mappedProfileForRemote({
        ...local,
        identityId: identity.userId,
        photo: "",
        cover: "",
      });
      await this.saveOwn(mapped);
      return "copied";
    },

    async peekPrivate(userId: string): Promise<ProfilePrivateRow | null> {
      await requireIdentity();
      return deps.profiles.getPrivateByUserId(userId);
    },
  };
}

export type SchemaAProfile = ReturnType<typeof createSchemaAProfile>;

let cachedDefault: SchemaAProfile | null = null;

async function productionProfilePort(): Promise<SchemaAProfilePort> {
  const url = import.meta.env.VITE_APP_SUPABASE_URL;
  const key = import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY;
  const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
  const identity = await getSchemaAAuth().getIdentity();
  if (!identity) {
    throw new SchemaAProfileError("No remote Auth session", SchemaAProfileErrorCode.NO_SESSION);
  }
  const { supabase } = await import("@/lib/supabase/client");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    throw new SchemaAProfileError("No remote Auth session", SchemaAProfileErrorCode.NO_SESSION);
  }
  const { createSchemaAClient } = await import("@/integrations/supabase/remote/client");
  const { RemoteProfileRepository } =
    await import("@/integrations/supabase/remote/profile.repository");
  const client = createSchemaAClient(url, key, { accessToken: token });
  return new RemoteProfileRepository(client);
}

function lazyProfilePort(): SchemaAProfilePort {
  let portPromise: Promise<SchemaAProfilePort> | null = null;
  const port = () => (portPromise ??= productionProfilePort());
  return {
    async getOwn() {
      return (await port()).getOwn();
    },
    async updateOwn(patch) {
      return (await port()).updateOwn(patch);
    },
    async getOwnPrivate() {
      return (await port()).getOwnPrivate();
    },
    async getPrivateByUserId(userId) {
      return (await port()).getPrivateByUserId(userId);
    },
    async updateOwnPrivate(patch) {
      return (await port()).updateOwnPrivate(patch);
    },
  };
}

export function getSchemaAProfile(): SchemaAProfile {
  if (cachedDefault) return cachedDefault;
  cachedDefault = createSchemaAProfile({
    isEnabled: isRemoteProfileEnabled,
    async getIdentity() {
      const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
      return getSchemaAAuth().getIdentity();
    },
    profiles: lazyProfilePort(),
  });
  return cachedDefault;
}

export function resetSchemaAProfileSingletonForTests(): void {
  cachedDefault = null;
}
