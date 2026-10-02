import { demoStorageKey } from "@/lib/demo/demo-config";
import { getLocalMediaBlob, getLocalMediaRecord, saveLocalMedia } from "@/lib/media/local-media-storage";
import { isDurationWithinLimit, resolveMediaDurationSeconds } from "@/lib/media/media-duration";

export const REEL_DRAFT_STORAGE_KEY = demoStorageKey("reel-draft");

export type ReelDraftRecord = {
  mediaId: string;
  durationSec: number;
  mimeType: string;
  fileName: string;
};

export function readReelDraft(): ReelDraftRecord | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(REEL_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReelDraftRecord;
    if (!parsed?.mediaId || !isDurationWithinLimit(parsed.durationSec, Number.MAX_SAFE_INTEGER)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeReelDraft(draft: ReelDraftRecord): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(REEL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearReelDraft(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(REEL_DRAFT_STORAGE_KEY);
}

export async function persistReelDraftClip(input: {
  blob: Blob;
  mimeType: string;
  fileName: string;
  recordedSec: number;
  metadataSec?: number | null;
  maxSeconds: number;
  onProgress?: (percent: number) => void;
}): Promise<ReelDraftRecord> {
  const durationSec = resolveMediaDurationSeconds({
    recordedSec: input.recordedSec,
    metadataSec: input.metadataSec,
    maxSeconds: input.maxSeconds,
  });
  input.onProgress?.(35);
  const record = await saveLocalMedia({
    kind: "reel",
    scope: "reel",
    blob: input.blob,
    mimeType: input.mimeType,
    fileName: input.fileName,
    durationMs: durationSec * 1000,
  });
  input.onProgress?.(100);
  const draft: ReelDraftRecord = {
    mediaId: record.id,
    durationSec,
    mimeType: record.mimeType,
    fileName: input.fileName,
  };
  writeReelDraft(draft);
  return draft;
}

export async function restoreReelDraftFile(): Promise<{ file: File; draft: ReelDraftRecord } | null> {
  const draft = readReelDraft();
  if (!draft) return null;
  const meta = await getLocalMediaRecord(draft.mediaId);
  if (!meta) {
    clearReelDraft();
    return null;
  }
  const blob = await getLocalMediaBlob(draft.mediaId);
  const durationSec = resolveMediaDurationSeconds({
    recordedSec: draft.durationSec,
    metadataSec: meta.durationMs ? meta.durationMs / 1000 : null,
    maxSeconds: Number.MAX_SAFE_INTEGER,
  });
  const file = new File([blob], draft.fileName, { type: draft.mimeType || blob.type });
  return { file, draft: { ...draft, durationSec } };
}
