export async function downloadLocalBlob(input: {
  blob: Blob;
  fileName: string;
}): Promise<void> {
  const objectUrl = URL.createObjectURL(input.blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = input.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function fileNameForMedia(mimeType: string, prefix = "connexy"): string {
  if (mimeType.includes("mp4")) return `${prefix}.mp4`;
  if (mimeType.includes("webm")) return `${prefix}.webm`;
  if (mimeType.includes("ogg")) return `${prefix}.ogg`;
  if (mimeType.includes("png")) return `${prefix}.png`;
  if (mimeType.includes("webp")) return `${prefix}.webp`;
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return `${prefix}.jpg`;
  if (mimeType.startsWith("audio/")) return `${prefix}.webm`;
  if (mimeType.startsWith("video/")) return `${prefix}.webm`;
  return `${prefix}.bin`;
}
