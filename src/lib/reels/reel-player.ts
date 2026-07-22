export function getPlayerState(
  video: HTMLVideoElement,
): "playing" | "paused" | "loading" | "ended" {
  if (video.readyState < 2) return "loading";
  if (video.ended) return "ended";
  if (video.paused) return "paused";
  return "playing";
}

export function togglePlay(video: HTMLVideoElement): void {
  if (video.paused) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

export function toggleMute(video: HTMLVideoElement): boolean {
  video.muted = !video.muted;
  return video.muted;
}

export function getProgress(video: HTMLVideoElement): number {
  if (!video.duration || !isFinite(video.duration)) return 0;
  return (video.currentTime / video.duration) * 100;
}

export function getPlaybackTime(video: HTMLVideoElement): string {
  const secs = Math.floor(video.currentTime);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function setPlaybackRate(video: HTMLVideoElement, rate: number): void {
  video.playbackRate = rate;
}

export function seekTo(video: HTMLVideoElement, percent: number): void {
  if (!video.duration || !isFinite(video.duration)) return;
  video.currentTime = (percent / 100) * video.duration;
}
