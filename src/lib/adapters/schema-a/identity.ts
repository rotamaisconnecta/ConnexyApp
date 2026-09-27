import type { DemoIdentity } from "@/lib/demo/demo-identity";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import { isSchemaAUuid, requireSchemaAUuid } from "./ids";

/** Supabase Auth identity. Never interchangeable with the demo identity helper. */
export type SchemaAAuthIdentity = {
  userId: string;
};

export function toSchemaAAuthIdentity(userId: string): SchemaAAuthIdentity {
  return { userId: requireSchemaAUuid(userId, "userId") };
}

export function demoIdentityIsRemoteAuth(identity: DemoIdentity): boolean {
  return isSchemaAUuid(identity.id);
}

/**
 * Demo identity and Auth identity stay distinct. This does not convert
 * `lucas` into a UUID and does not replace the demo identity helper.
 */
export function assertDistinctIdentityContexts(
  demo: DemoIdentity,
  remote: SchemaAAuthIdentity,
): void {
  if (demo.id === remote.userId && !isSchemaAUuid(demo.id)) {
    throw new AdapterMappingError(
      "Demo identity collided with a non-UUID remote id",
      AdapterMappingCode.IDENTITY_COLLISION,
      "id",
    );
  }
}
