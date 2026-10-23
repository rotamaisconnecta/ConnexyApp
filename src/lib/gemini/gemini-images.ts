import { GeminiError, GeminiErrorCode } from "./gemini-errors";
import type { GeminiImageInput } from "./gemini-types";

export const GEMINI_IMAGE_MAX_COUNT = 4;
export const GEMINI_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const GEMINI_ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const BASE64_MAX_CHARS = Math.ceil((GEMINI_IMAGE_MAX_BYTES * 4) / 3) + 8;

export function normalizeGeminiImageMime(mimeType: string | undefined): string {
  const raw = (mimeType ?? "").trim().toLowerCase();
  if (raw === "image/jpg") return "image/jpeg";
  return raw;
}

export function isAllowedGeminiImageMime(mimeType: string | undefined): boolean {
  return (GEMINI_ALLOWED_IMAGE_MIME as readonly string[]).includes(normalizeGeminiImageMime(mimeType));
}

export function stripDataUrlPrefix(data: string): string {
  const marker = "base64,";
  const index = data.indexOf(marker);
  return index >= 0 ? data.slice(index + marker.length) : data;
}

export function estimateBase64Bytes(data: string): number {
  const normalized = stripDataUrlPrefix(data).replace(/\s+/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function fingerprintGeminiImage(image: GeminiImageInput): string {
  const data = stripDataUrlPrefix(image.data);
  return `${normalizeGeminiImageMime(image.mimeType)}:${data.length}:${data.slice(0, 24)}:${data.slice(-24)}`;
}

export function sanitizeGeminiImages(images: GeminiImageInput[] | undefined): GeminiImageInput[] {
  if (!images?.length) return [];
  if (images.length > GEMINI_IMAGE_MAX_COUNT) {
    throw new GeminiError(GeminiErrorCode.INVALID_IMAGE);
  }
  return images.map((image) => {
    const mimeType = normalizeGeminiImageMime(image.mimeType);
    const data = stripDataUrlPrefix(image.data).replace(/\s+/g, "");
    if (!isAllowedGeminiImageMime(mimeType) || !data) {
      throw new GeminiError(GeminiErrorCode.INVALID_IMAGE);
    }
    if (data.length > BASE64_MAX_CHARS || estimateBase64Bytes(data) > GEMINI_IMAGE_MAX_BYTES) {
      throw new GeminiError(GeminiErrorCode.INVALID_IMAGE);
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
      throw new GeminiError(GeminiErrorCode.INVALID_IMAGE);
    }
    return { mimeType, data };
  });
}

export async function fileToGeminiImage(file: File): Promise<GeminiImageInput> {
  if (!isAllowedGeminiImageMime(file.type) || file.size > GEMINI_IMAGE_MAX_BYTES) {
    throw new GeminiError(GeminiErrorCode.INVALID_IMAGE);
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new GeminiError(GeminiErrorCode.INVALID_IMAGE));
    reader.readAsDataURL(file);
  });
  const [sanitized] = sanitizeGeminiImages([
    { mimeType: file.type, data: dataUrl },
  ]);
  return sanitized;
}
