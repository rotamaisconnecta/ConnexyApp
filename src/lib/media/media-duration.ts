import { CHAT_VIDEO_MAX_DURATION_SECONDS } from "@/lib/chat/chat-limits";
import { REEL_MAX_DURATION_SECONDS } from "@/lib/reels/reel-limits";

export { CHAT_VIDEO_MAX_DURATION_SECONDS };

export function isFinitePositiveDuration(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds > 0;
}

export function isDurationWithinLimit(seconds: number, maxSeconds: number): boolean {
  return isFinitePositiveDuration(seconds) && seconds <= maxSeconds + 0.05;
}

export function clampRecordedDuration(elapsedSec: number, maxSeconds: number): number {
  if (!isFinitePositiveDuration(elapsedSec)) return 1;
  return Math.min(Math.round(elapsedSec), maxSeconds);
}

/**
 * Combina o relógio da gravação com metadados do arquivo.
 * Infinity, 0, NaN e o teto máximo nunca viram duração padrão.
 */
export function resolveMediaDurationSeconds(input: {
  recordedSec?: number | null;
  metadataSec?: number | null;
  maxSeconds: number;
}): number {
  const recorded = input.recordedSec ?? null;
  const metadata = input.metadataSec ?? null;
  const maxSeconds = input.maxSeconds;
  const recordedOk = recorded != null && isFinitePositiveDuration(recorded);
  const metadataOk =
    metadata != null && isFinitePositiveDuration(metadata) && metadata <= maxSeconds + 0.05;

  if (recordedOk && metadataOk && Math.abs(metadata - maxSeconds) < 0.51 && recorded < maxSeconds - 1) {
    return clampRecordedDuration(recorded, maxSeconds);
  }
  if (recordedOk && metadataOk && Math.abs(metadata - recorded) <= 2) {
    return Math.round(metadata);
  }
  if (recordedOk) return clampRecordedDuration(recorded, maxSeconds);
  if (metadataOk) return Math.round(metadata);
  return 1;
}

export function formatExactDurationLabel(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  if (whole < 60) return `${whole}s`;
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export async function readVideoDurationSeconds(source: Blob): Promise<number | null> {
  if (typeof document === "undefined") return null;
  const objectUrl = URL.createObjectURL(source);
  try {
    return await new Promise<number | null>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const finish = (value: number | null) => {
        video.removeAttribute("src");
        video.load();
        resolve(value);
      };
      video.onloadedmetadata = () => {
        if (isFinitePositiveDuration(video.duration)) {
          finish(video.duration);
          return;
        }
        video.ontimeupdate = () => {
          if (isFinitePositiveDuration(video.duration)) finish(video.duration);
        };
        try {
          video.currentTime = 1e10;
        } catch {
          finish(null);
        }
      };
      video.onerror = () => finish(null);
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function reelDurationLimit(): number {
  return REEL_MAX_DURATION_SECONDS;
}

export function chatVideoDurationLimit(): number {
  return CHAT_VIDEO_MAX_DURATION_SECONDS;
}
