import { useState, useCallback, useRef, useEffect } from "react";
import { Pause, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAudioDuration } from "@/lib/chat/chat-format";
import { useLocalMediaUrl } from "@/hooks/use-local-media-url";

interface AudioPlayerProps {
  durationSec: number;
  waveform?: number[];
  isMine?: boolean;
  src?: string | null;
  mediaId?: string | null;
}

export function AudioPlayer({
  durationSec,
  isMine = false,
  src,
  mediaId,
}: AudioPlayerProps) {
  const resolved = useLocalMediaUrl(mediaId);
  const playable = resolved || src || null;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const total = Math.max(durationSec, 1);
  const progress = Math.min(100, (currentSec / total) * 100);

  const togglePlay = useCallback(() => {
    if (!playable) return;
    if (!audioRef.current) audioRef.current = new Audio(playable);
    else if (audioRef.current.src !== playable) audioRef.current.src = playable;
    const audio = audioRef.current;
    audio.ontimeupdate = () => setCurrentSec(audio.currentTime);
    audio.onended = () => {
      setPlaying(false);
      setCurrentSec(0);
    };
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [playable, playing]);

  return (
    <div className="flex min-w-[168px] w-full items-center gap-2.5">
      <button
        type="button"
        onClick={togglePlay}
        disabled={!playable}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform active:scale-95",
          isMine
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-primary/15 text-primary",
        )}
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {!playable && mediaId ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "h-[3px] overflow-hidden rounded-full",
            isMine ? "bg-primary-foreground/25" : "bg-primary/20",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-150",
              isMine ? "bg-primary-foreground" : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span
        className={cn(
          "text-[10px] font-mono tabular-nums shrink-0",
          isMine ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {playing || currentSec > 0
          ? `${formatAudioDuration(currentSec)} / ${formatAudioDuration(total)}`
          : formatAudioDuration(total)}
      </span>
    </div>
  );
}
