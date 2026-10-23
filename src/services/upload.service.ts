import { StorageHelper } from "@/lib/supabase/storage";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { validateMediaPath } from "@/lib/media/media-path";
import type { UploadDestination, UploadedMedia } from "@/lib/upload/upload-types";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class UploadUnavailableError extends Error {
  constructor() {
    super("Os uploads não estão disponíveis neste modo.");
    this.name = "UploadUnavailableError";
  }
}

export class UploadStorageError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível enviar o arquivo. Tente novamente.");
    this.name = "UploadStorageError";
    console.error("[Upload] Storage upload failed.", cause);
  }
}

function validateFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo nao permitido. Aceitos: JPEG, PNG, WebP, GIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo deve ter no maximo ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function buildMediaPath(file: File, pathPrefix?: string): string {
  const extension = sanitizePathSegment(file.name.split(".").pop() || "bin");
  const name = `${crypto.randomUUID()}.${extension}`;
  const prefix = pathPrefix?.split("/").filter(Boolean).map(sanitizePathSegment).join("/");

  return prefix ? `${prefix}/${name}` : name;
}

export const BUCKETS = {
  avatars: "avatars",
  bioMedia: "bio-media",
} as const;

export type AllowedBucket = (typeof BUCKETS)[keyof typeof BUCKETS];

function extractStoragePathFromUrl(reference: string): string | null {
  if (typeof reference !== "string") return null;
  const value = reference.trim();
  if (value === "") return null;

  // Canonical path persisted by the active writers (`{ownerId}/{uuid}.ext`).
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    const validation = validateMediaPath(value);
    return validation.ok ? value : null;
  }

  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/public/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = url.pathname.slice(idx + marker.length);
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) return null;
    // Defense in depth: the path sliced out of a legacy URL is re-validated
    // with the same canonical rules before it can reach a delete call.
    const extracted = rest.slice(slashIdx + 1);
    const validation = validateMediaPath(extracted);
    return validation.ok ? extracted : null;
  } catch {
    return null;
  }
}

export const UploadService = {
  async uploadMedia(destination: UploadDestination, file: File): Promise<UploadedMedia> {
    if (!isPublicSupabaseConfigured()) throw new UploadUnavailableError();
    if (!destination.bucket.trim()) throw new UploadUnavailableError();

    const path = buildMediaPath(file, destination.pathPrefix);
    const { error } = await StorageHelper.upload(destination.bucket, path, file, {
      contentType: file.type || undefined,
    });
    if (error) throw new UploadStorageError(error);

    const { data } = StorageHelper.getPublicUrl(destination.bucket, path);
    return { path, url: data.publicUrl };
  },

  async uploadImage(bucket: string, path: string, file: File) {
    validateFile(file);
    const url = await StorageHelper.upload(bucket, path, file);
    return url;
  },

  async uploadAvatar(userId: string, file: File) {
    validateFile(file);
    const ext = "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const result = await StorageHelper.upload(BUCKETS.avatars, path, file, {
      contentType: "image/jpeg",
    });
    return { result, path };
  },

  async uploadPostMedia(userId: string, file: File, bucket: AllowedBucket) {
    validateFile(file);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const result = await StorageHelper.upload(bucket, path, file);
    return { result, path };
  },

  async getPublicUrl(bucket: string, path: string) {
    const url = StorageHelper.getPublicUrl(bucket, path);
    return url;
  },

  async deleteFile(bucket: string, paths: string[]) {
    if (paths.length === 0) return;
    await StorageHelper.remove(bucket, paths);
  },

  extractStoragePathFromUrl,
};
