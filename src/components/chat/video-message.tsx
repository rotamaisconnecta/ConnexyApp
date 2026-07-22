import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAudioDuration } from "@/lib/chat/chat-format";

interface VideoMessageProps {
  url: string;
  thumbnail?: string;
  durationSec?: number;
}

export function VideoMessage({ url, thumbnail, durationSec }: VideoMessageProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        src={url}
        controls
        autoPlay
        className="w-full rounded-2xl"
        onEnded={() => setPlaying(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative w-full rounded-2xl overflow-hidden group"
      aria-label="Reproduzir vídeo"
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="w-full aspect-video object-cover" />
      ) : (
        <div className="w-full aspect-video bg-muted grid place-items-center">
          <span className="text-3xl">🎬</span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors grid place-items-center">
        <div className="h-12 w-12 rounded-full bg-white/90 grid place-items-center shadow-elegant">
          <Play className="h-5 w-5 text-foreground ml-0.5" />
        </div>
      </div>

      {durationSec && (
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono rounded-full px-2 py-0.5">
          {formatAudioDuration(durationSec)}
        </span>
      )}
    </button>
  );
}
