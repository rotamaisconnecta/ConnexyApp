import { UploadService } from "@/services/upload.service";
import type { MediaFile, UploadDestination, UploadedMedia } from "./upload-types";

export function uploadStorage(
  file: MediaFile,
  destination: UploadDestination,
): Promise<UploadedMedia> {
  return UploadService.uploadMedia(destination, file.file);
}

export async function uploadMultiple(
  files: MediaFile[],
  destination: UploadDestination,
): Promise<UploadedMedia[]> {
  return Promise.all(files.map((file) => uploadStorage(file, destination)));
}
