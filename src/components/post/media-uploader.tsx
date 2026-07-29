import { useCallback } from "react";
import { UploadMedia } from "@/components/upload";
import { MediaFile } from "@/lib/upload";
import {
  type PostMedia,
  MAX_MEDIA_FILES,
} from "@/lib/types/post";

interface MediaUploaderProps {
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
}

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const toMediaFile = useCallback(
    (files: MediaFile[]) => {
      const postMedia: PostMedia[] = files.map((f) => ({
        id: f.id,
        file: f.file,
        preview: f.preview,
        type: f.type.startsWith("video/") ? "video" : "image",
      }));
      onChange(postMedia);
    },
    [onChange],
  );

  const mediaFiles: MediaFile[] = media.map((m) => ({
    id: m.id,
    name: m.file.name,
    type: m.file.type,
    size: m.file.size,
    url: m.preview,
    preview: m.preview,
    status: 'ready' as const,
    progress: 0,
    file: m.file,
  }));

  return (
    <UploadMedia
      mode="mixed"
      multiple
      maxFiles={MAX_MEDIA_FILES}
      value={mediaFiles}
      onChange={toMediaFile}
      label="Arraste imagens"
    />
  );
}
