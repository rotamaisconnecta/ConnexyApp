import { describe, expect, test } from "bun:test";
import { CHAT_VIDEO_MAX_DURATION_SECONDS } from "../src/lib/chat/chat-limits";
import { REEL_MAX_DURATION_SECONDS } from "../src/lib/reels/reel-limits";
import {
  isDurationWithinLimit,
  resolveMediaDurationSeconds,
} from "../src/lib/media/media-duration";
import { validateReelVideo } from "../src/lib/reels/reel-publish";

function videoFile(name = "clip.webm"): File {
  return new File(["bytes"], name, { type: "video/webm" });
}

describe("Duração real de Reels e vídeos de conversa", () => {
  test("Reels curtos e o teto de 90s são válidos; acima disso rejeita", () => {
    for (const seconds of [3, 5, 10, 30, 89, 90]) {
      expect(isDurationWithinLimit(seconds, REEL_MAX_DURATION_SECONDS)).toBe(true);
      expect(validateReelVideo(videoFile(), seconds)).toBeNull();
    }
    expect(isDurationWithinLimit(91, REEL_MAX_DURATION_SECONDS)).toBe(false);
    expect(validateReelVideo(videoFile(), 91)).toBe("duration");
    expect(validateReelVideo(videoFile(), 0)).toBe("duration");
  });

  test("metadados iguais ao teto não substituem uma gravação curta", () => {
    expect(
      resolveMediaDurationSeconds({
        recordedSec: 5,
        metadataSec: REEL_MAX_DURATION_SECONDS,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).toBe(5);
    expect(
      resolveMediaDurationSeconds({
        recordedSec: 5,
        metadataSec: Number.POSITIVE_INFINITY,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).toBe(5);
    expect(
      resolveMediaDurationSeconds({
        recordedSec: 5,
        metadataSec: 0,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).toBe(5);
    expect(
      resolveMediaDurationSeconds({
        recordedSec: 5,
        metadataSec: null,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).toBe(5);
  });

  test("90s só aparece quando a gravação realmente chegou no limite", () => {
    expect(
      resolveMediaDurationSeconds({
        recordedSec: 90,
        metadataSec: 90,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).toBe(90);
    expect(
      resolveMediaDurationSeconds({
        recordedSec: null,
        metadataSec: null,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
      }),
    ).not.toBe(REEL_MAX_DURATION_SECONDS);
  });

  test("conversas aceitam 5s e 30s e rejeitam acima de 30s", () => {
    expect(CHAT_VIDEO_MAX_DURATION_SECONDS).toBe(30);
    expect(isDurationWithinLimit(5, CHAT_VIDEO_MAX_DURATION_SECONDS)).toBe(true);
    expect(isDurationWithinLimit(30, CHAT_VIDEO_MAX_DURATION_SECONDS)).toBe(true);
    expect(isDurationWithinLimit(31, CHAT_VIDEO_MAX_DURATION_SECONDS)).toBe(false);
  });
});
