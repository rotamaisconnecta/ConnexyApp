import { downloadLocalBlob, fileNameForMedia } from "@/lib/media/download-local-media";
import { getLocalMediaBlob, getLocalMediaRecord } from "@/lib/media/local-media-storage";

export type SharedPhotoFile = {
  blob: Blob;
  file: File;
};

export async function resolveChatPhotoFile(input: {
  mediaId?: string | null;
  src: string;
}): Promise<SharedPhotoFile> {
  let blob: Blob;
  let fileName = "foto-connexy.jpg";

  if (input.mediaId) {
    blob = await getLocalMediaBlob(input.mediaId);
    const record = await getLocalMediaRecord(input.mediaId);
    fileName = record?.fileName?.trim() || fileNameForMedia(blob.type, "foto-connexy");
  } else {
    const response = await fetch(input.src);
    if (!response.ok) throw new Error("photo-unavailable");
    blob = await response.blob();
    fileName = fileNameForMedia(blob.type, "foto-connexy");
  }

  const type = blob.type || "image/jpeg";
  const file = new File([blob], fileName, { type });
  return { blob, file };
}

export async function saveChatPhotoFile(input: {
  mediaId?: string | null;
  src: string;
}): Promise<void> {
  const { blob, file } = await resolveChatPhotoFile(input);
  await downloadLocalBlob({ blob, fileName: file.name });
}

export async function shareChatPhotoFile(input: {
  mediaId?: string | null;
  src: string;
}): Promise<"shared" | "copied" | "saved" | "aborted"> {
  const { blob, file } = await resolveChatPhotoFile(input);
  const payload = { files: [file], title: "Foto" };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "aborted";
    }
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard.write === "function"
  ) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      return "copied";
    } catch {
      /* fall through to download */
    }
  }

  await downloadLocalBlob({ blob, fileName: file.name });
  return "saved";
}
