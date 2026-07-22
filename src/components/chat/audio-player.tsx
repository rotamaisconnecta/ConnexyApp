import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAudioDuration } from "@/lib/chat/chat-format";

interface AudioPlayerProps {
  durationSec: number;
  waveform?: number[];
  isMine?: boolean;
}

export function AudioPlayer({ durationSec, waveform, isMine = false }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const bars = waveform ?? generateDefaultWaveform(30);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaying(false);
      return;
    }

    setPlaying(true);
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (durationSec * 10);
        if (next >= 100) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          return 0;
        }
        return next;
      });
    }, 100);
  }, [playing, durationSec]);

  return (
    <div className="flex items-center gap-2.5 min-w-[200px]">
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "h-8 w-8 rounded-full grid place-items-center shrink-0 transition-colors",
          isMine
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-primary/15 text-primary",
        )}
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 flex items-end gap-[2px] h-6">
        {bars.map((value, i) => {
          const activeIndex = Math.floor((progress / 100) * bars.length);
          const isActive = i <= activeIndex;

          return (
            <div
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-colors duration-150",
                isActive
                  ? isMine
                    ? "bg-primary-foreground/70"
                    : "bg-primary"
                  : isMine
                    ? "bg-primary-foreground/25"
                    : "bg-muted-foreground/30",
              )}
              style={{ height: `${Math.max(value * 100, 15)}%` }}
            />
          );
        })}
      </div>

      <span
        className={cn(
          "text-[10px] font-mono tabular-nums shrink-0",
          isMine ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {playing
          ? formatAudioDuration((progress / 100) * durationSec)
          : formatAudioDuration(durationSec)}
      </span>
    </div>
  );
}

function generateDefaultWaveform(count: number): number[] {
  return Array.from({ length: count }, () => Math.random() * 0.7 + 0.3);
}
