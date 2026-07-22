import { StorageHelper } from "@/lib/supabase/storage";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validateFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
}

export const UploadService = {
  async uploadImage(bucket: string, path: string, file: File) {
    validateFile(file);
    const url = await StorageHelper.upload(bucket, path, file);
    return url;
  },

  async uploadAvatar(userId: string, file: File) {
    validateFile(file);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const url = await StorageHelper.upload("avatars", path, file);
    return url;
  },

  async uploadPostMedia(postId: string, file: File) {
    validateFile(file);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${postId}/${Date.now()}.${ext}`;
    const url = await StorageHelper.upload("posts", path, file);
    return url;
  },

  async getPublicUrl(bucket: string, path: string) {
    const url = StorageHelper.getPublicUrl(bucket, path);
    return url;
  },

  async deleteFile(bucket: string, paths: string[]) {
    if (paths.length === 0) {
      throw new Error("No paths provided");
    }
    await StorageHelper.remove(bucket, paths);
  },
};
