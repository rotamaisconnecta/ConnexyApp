import { Play } from "lucide-react";
import { formatAudioDuration } from "@/lib/chat/chat-format";

interface VideoMessageProps {
  url: string;
  thumbnail?: string;
  durationSec?: number;
  selecting?: boolean;
  onOpenMedia?: () => void;
}

export function VideoMessage({
  url,
  thumbnail,
  durationSec,
  selecting = false,
  onOpenMedia,
}: VideoMessageProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        if (selecting) {
          event.preventDefault();
          return;
        }
        onOpenMedia?.();
      }}
      className="group relative w-full overflow-hidden rounded-[24px] shadow-[0_12px_28px_rgba(24,24,43,0.06)]"
      aria-label={selecting ? "Selecionar vídeo" : "Abrir vídeo"}
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="pointer-events-none aspect-video w-full object-cover" />
      ) : (
        <video
          src={url}
          className="pointer-events-none aspect-video w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      )}
      <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/90 shadow-elegant">
          <Play className="ml-0.5 h-5 w-5 text-foreground" />
        </div>
      </div>
      {durationSec ? (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
          {formatAudioDuration(durationSec)}
        </span>
      ) : null}
    </button>
  );
}
