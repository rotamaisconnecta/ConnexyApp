import { useState, useCallback } from "react";
import { UploadService } from "@/services/upload.service";
import type { UploadDestination } from "@/lib/upload";

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

  const uploadMedia = useCallback(async (destination: UploadDestination, file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await UploadService.uploadMedia(destination, file);
      setProgress(100);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Não foi possível enviar o arquivo."));
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

  const uploadPostMedia = useCallback(async (userId: string, file: File, bucket: string) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await UploadService.uploadPostMedia(
        userId,
        file,
        bucket as Parameters<typeof UploadService.uploadPostMedia>[2],
      );
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
    uploadMedia,
    uploadAvatar,
    uploadPostMedia,
    isUploading,
    progress,
    error,
  };
}
