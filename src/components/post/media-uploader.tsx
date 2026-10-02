import { useCallback, useState } from "react";
import { UploadMedia } from "@/components/upload";
import { MediaFile, createMediaFile } from "@/lib/upload";
import { type PostMedia, MAX_MEDIA_FILES } from "@/lib/types/post";
import { CameraCapture } from "@/components/media/camera-capture";

interface MediaUploaderProps {
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
}

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const [cameraOpen, setCameraOpen] = useState(false);

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
    status: "ready" as const,
    progress: 0,
    file: m.file,
  }));

  function handleCapturedPhoto(blob: Blob, fileName: string) {
    const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
    const created = createMediaFile(file);
    toMediaFile([...mediaFiles, created].slice(0, MAX_MEDIA_FILES));
    setCameraOpen(false);
  }

  return (
    <>
      <UploadMedia
        mode="mixed"
        multiple
        maxFiles={MAX_MEDIA_FILES}
        value={mediaFiles}
        onChange={toMediaFile}
        label="Arraste imagens"
        onLivePhoto={() => setCameraOpen(true)}
      />
      {cameraOpen ? (
        <CameraCapture
          title="Tirar foto"
          confirmLabel="Usar foto"
          onCancel={() => setCameraOpen(false)}
          onCapture={handleCapturedPhoto}
        />
      ) : null}
    </>
  );
}
