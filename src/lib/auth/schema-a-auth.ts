import { toSchemaAAuthIdentity, type SchemaAAuthIdentity } from "@/lib/adapters/schema-a/identity";
import { isRemoteAuthEnabled } from "./schema-a-auth-flag";

export type RemoteAuthIdentity = SchemaAAuthIdentity;

export const SchemaAAuthErrorCode = {
  DISABLED: "DISABLED",
  NO_SESSION: "NO_SESSION",
  INVALID_USER: "INVALID_USER",
  AUTH: "AUTH",
} as const;

export type SchemaAAuthErrorCodeValue =
  (typeof SchemaAAuthErrorCode)[keyof typeof SchemaAAuthErrorCode];

export class SchemaAAuthError extends Error {
  readonly code: SchemaAAuthErrorCodeValue;

  constructor(message: string, code: SchemaAAuthErrorCodeValue) {
    super(message);
    this.name = "SchemaAAuthError";
    this.code = code;
  }
}

type AuthUser = { id: string };

export type SchemaAAuthPort = {
  getUser: () => Promise<{ data: { user: AuthUser | null }; error: { message: string } | null }>;
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ data: { user: AuthUser | null }; error: { message: string } | null }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
};

export type SchemaAAuthDeps = {
  isEnabled: () => boolean;
  auth: SchemaAAuthPort;
};

function toIdentity(userId: string | null | undefined): RemoteAuthIdentity | null {
  if (!userId) return null;
  return toSchemaAAuthIdentity(userId);
}

/**
 * Minimal Auth foundation. Uses an injected Auth port so tests never need a
 * second Supabase instance. Production wiring reuses `@/lib/supabase/client`.
 */
export function createSchemaAAuth(deps: SchemaAAuthDeps) {
  async function requireEnabled(): Promise<void> {
    if (!deps.isEnabled()) {
      throw new SchemaAAuthError("Schema A Auth is disabled", SchemaAAuthErrorCode.DISABLED);
    }
  }

  return {
    isEnabled(): boolean {
      return deps.isEnabled();
    },

    async getIdentity(): Promise<RemoteAuthIdentity | null> {
      if (!deps.isEnabled()) return null;
      const { data, error } = await deps.auth.getUser();
      if (error) {
        throw new SchemaAAuthError(error.message, SchemaAAuthErrorCode.AUTH);
      }
      return toIdentity(data.user?.id);
    },

    async signIn(email: string, password: string): Promise<RemoteAuthIdentity> {
      await requireEnabled();
      const { data, error } = await deps.auth.signInWithPassword({ email, password });
      if (error) {
        throw new SchemaAAuthError(error.message, SchemaAAuthErrorCode.AUTH);
      }
      const identity = toIdentity(data.user?.id);
      if (!identity) {
        throw new SchemaAAuthError("Sign-in returned no user", SchemaAAuthErrorCode.INVALID_USER);
      }
      return identity;
    },

    async signOut(): Promise<void> {
      if (!deps.isEnabled()) return;
      const { error } = await deps.auth.signOut();
      if (error) {
        throw new SchemaAAuthError(error.message, SchemaAAuthErrorCode.AUTH);
      }
    },
  };
}

export type SchemaAAuth = ReturnType<typeof createSchemaAAuth>;

let cachedDefault: SchemaAAuth | null = null;

async function existingProjectAuthPort(): Promise<SchemaAAuthPort> {
  const { supabase } = await import("@/lib/supabase/client");
  return supabase.auth;
}

/**
 * Production entry: existing browser client, same URL/key as the rest of the app.
 * Instantiates the client only when remote Auth is enabled.
 */
export function getSchemaAAuth(): SchemaAAuth {
  if (cachedDefault) return cachedDefault;
  let portPromise: Promise<SchemaAAuthPort> | null = null;
  const lazyPort: SchemaAAuthPort = {
    async getUser() {
      const port = await (portPromise ??= existingProjectAuthPort());
      return port.getUser();
    },
    async signInWithPassword(credentials) {
      const port = await (portPromise ??= existingProjectAuthPort());
      return port.signInWithPassword(credentials);
    },
    async signOut() {
      const port = await (portPromise ??= existingProjectAuthPort());
      return port.signOut();
    },
  };
  cachedDefault = createSchemaAAuth({
    isEnabled: isRemoteAuthEnabled,
    auth: lazyPort,
  });
  return cachedDefault;
}

/** Reset the singleton. Tests only. */
export function resetSchemaAAuthSingletonForTests(): void {
  cachedDefault = null;
}

/**
 * Foundation for a future Auth User → Profile link.
 * Does not fetch profile_private, does not copy the demo blob.
 */
export function profileIdFromRemoteAuth(identity: RemoteAuthIdentity): string {
  return identity.userId;
}
