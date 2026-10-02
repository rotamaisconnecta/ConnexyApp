import { validateReelVideo } from "@/lib/reels/reel-publish";
import { REEL_MAX_DURATION_SECONDS } from "@/lib/reels/reel-limits";
import { CHAT_VIDEO_MAX_DURATION_SECONDS } from "@/lib/chat/chat-limits";
import {
  isDurationWithinLimit,
  resolveMediaDurationSeconds,
} from "@/lib/media/media-duration";

export function assertReelDurationAllowed(seconds: number): boolean {
  return isDurationWithinLimit(seconds, REEL_MAX_DURATION_SECONDS);
}

export function assertChatVideoDurationAllowed(seconds: number): boolean {
  return isDurationWithinLimit(seconds, CHAT_VIDEO_MAX_DURATION_SECONDS);
}

export function validateRecordedReel(file: File, durationS: number) {
  return validateReelVideo(file, durationS);
}

export function recoveredDurationAfterReload(input: {
  recordedSec: number;
  metadataSec?: number | null;
  storedDurationSec?: number | null;
  maxSeconds: number;
}): number {
  return resolveMediaDurationSeconds({
    recordedSec: input.storedDurationSec ?? input.recordedSec,
    metadataSec: input.metadataSec,
    maxSeconds: input.maxSeconds,
  });
}
