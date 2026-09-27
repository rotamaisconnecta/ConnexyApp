import { requireSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import { isRemoteAuthEnabled } from "@/lib/auth/schema-a-auth-flag";

/**
 * Schema A Storage uses the three buckets that already exist locally.
 * Do not invent `reel-media`, `post-media`, or catalog/chat buckets here.
 */
export const SCHEMA_A_STORAGE_BUCKETS = {
  avatars: "avatars",
  bioMedia: "bio-media",
  reelsMedia: "reels-media",
} as const;

export type SchemaAStorageBucket =
  (typeof SCHEMA_A_STORAGE_BUCKETS)[keyof typeof SCHEMA_A_STORAGE_BUCKETS];

/** Named in 1H-8 but not created: existing buckets cover Schema A media. */
export const SCHEMA_A_DEFERRED_BUCKETS = [
  "post-media",
  "reel-media",
  "catalog-covers",
  "chat-attachments",
] as const;

export const SCHEMA_A_STORAGE_PURPOSE = {
  avatar: "avatar",
  cover: "cover",
  bio: "bio",
  post: "post",
  reel: "reel",
  reelPoster: "reel-poster",
} as const;

export type SchemaAStoragePurpose =
  (typeof SCHEMA_A_STORAGE_PURPOSE)[keyof typeof SCHEMA_A_STORAGE_PURPOSE];

export type SchemaAStorageObject = {
  bucket: SchemaAStorageBucket;
  path: string;
  ownerId: string;
  purpose: SchemaAStoragePurpose;
};

const PURPOSE_BUCKET: Record<SchemaAStoragePurpose, SchemaAStorageBucket> = {
  avatar: SCHEMA_A_STORAGE_BUCKETS.avatars,
  cover: SCHEMA_A_STORAGE_BUCKETS.avatars,
  bio: SCHEMA_A_STORAGE_BUCKETS.bioMedia,
  post: SCHEMA_A_STORAGE_BUCKETS.bioMedia,
  reel: SCHEMA_A_STORAGE_BUCKETS.reelsMedia,
  "reel-poster": SCHEMA_A_STORAGE_BUCKETS.reelsMedia,
};

export function isSchemaAStorageEnabled(): boolean {
  return isRemoteAuthEnabled();
}

export function bucketForSchemaAPurpose(purpose: SchemaAStoragePurpose): SchemaAStorageBucket {
  return PURPOSE_BUCKET[purpose];
}

function sanitizeExtension(extension: string): string {
  const trimmed = extension.trim().replace(/^\./, "").toLowerCase();
  if (!/^[a-z0-9]{1,8}$/.test(trimmed)) {
    throw new Error("Storage object extension is invalid");
  }
  return trimmed;
}

/**
 * `{auth.uid()}/{purpose}/{objectId}.{ext}`
 * First segment must be the Auth UUID so existing Storage policies match.
 */
export function buildSchemaAStorageObject(input: {
  ownerId: string;
  purpose: SchemaAStoragePurpose;
  objectId: string;
  extension: string;
}): SchemaAStorageObject {
  const ownerId = requireSchemaAUuid(input.ownerId, "ownerId");
  const objectId = requireSchemaAUuid(input.objectId, "objectId");
  const extension = sanitizeExtension(input.extension);
  const purpose = input.purpose;
  return {
    bucket: bucketForSchemaAPurpose(purpose),
    path: `${ownerId}/${purpose}/${objectId}.${extension}`,
    ownerId,
    purpose,
  };
}

export function ownerIdFromStoragePath(path: string): string | null {
  const owner = path.split("/").filter(Boolean)[0];
  if (!owner) return null;
  try {
    return requireSchemaAUuid(owner, "ownerId");
  } catch {
    return null;
  }
}

export function isOwnedStoragePath(path: string, ownerId: string): boolean {
  const expected = requireSchemaAUuid(ownerId, "ownerId");
  return ownerIdFromStoragePath(path) === expected;
}

/** Columns store the object path, not a data URL and not a full public URL. */
export function isRemoteMediaPath(value: string): boolean {
  if (!value || value.startsWith("data:")) return false;
  return ownerIdFromStoragePath(value) !== null;
}
