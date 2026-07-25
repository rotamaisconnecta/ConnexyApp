import { useState, useCallback } from "react";
import { UploadService } from "@/services/upload.service";

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = useCallback(async (bucket: string, path: string, file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await UploadService.uploadImage(bucket, path, file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Upload failed"));
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (userId: string, file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await UploadService.uploadAvatar(userId, file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Upload failed"));
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadPostMedia = useCallback(async (postId: string, file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await UploadService.uploadPostMedia(postId, file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Upload failed"));
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadImage,
    uploadAvatar,
    uploadPostMedia,
    isUploading,
    progress,
    error,
  };
}
