import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  className?: string;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, title, artist, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev as (typeof SPEED_OPTIONS)[number]);
      const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Number(e.target.value);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div
      className={cn("flex items-center gap-3 p-3", className)}
      style={{
        borderRadius: Radius.md,
        background: Colors.surface,
        boxShadow: Shadows.soft,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.brand.primary }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <span style={{ color: "#FFFFFF" }}>
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </span>
      </motion.button>

      <div className="flex-1 min-w-0">
        {(title || artist) && (
          <div className="mb-1 truncate">
            {title && (
              <p className="text-sm font-semibold truncate" style={{ color: Colors.text.primary }}>
                {title}
              </p>
            )}
            {artist && (
              <p className="text-xs truncate" style={{ color: Colors.text.secondary }}>
                {artist}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums" style={{ color: Colors.text.secondary }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 cursor-pointer"
            style={{ accentColor: Colors.brand.primary }}
          />
          <span className="text-[10px] tabular-nums" style={{ color: Colors.text.secondary }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={cycleSpeed}
        className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
        style={{
          color: Colors.brand.primary,
          backgroundColor: `${Colors.brand.primary}15`,
        }}
        aria-label={`Playback speed ${speed}x`}
      >
        {speed}x
      </motion.button>
    </div>
  );
}
