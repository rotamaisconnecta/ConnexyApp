import { useState } from "react";
import { visibleMediaCaption } from "@/lib/chat/visible-media-caption";

interface ImageMessageProps {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  mediaId?: string;
  selecting?: boolean;
  onOpenMedia?: () => void;
}

export function ImageMessage({
  url,
  caption,
  width,
  height,
  selecting = false,
  onOpenMedia,
}: ImageMessageProps) {
  const visibleCaption = visibleMediaCaption(caption);
  const ready = Boolean(url);
  const [error, setError] = useState(false);

  return (
    <button
      type="button"
      disabled={!ready || error}
      onClick={(event) => {
        if (selecting || !ready || error) {
          event.preventDefault();
          return;
        }
        onOpenMedia?.();
      }}
      className="block w-full overflow-hidden rounded-[24px] text-left shadow-[0_12px_28px_rgba(24,24,43,0.06)]"
      aria-label={selecting ? "Selecionar foto" : "Abrir foto"}
    >
      {!error && ready ? (
        <div
          className="relative bg-muted"
          style={width && height ? { aspectRatio: `${width}/${height}` } : undefined}
        >
          <img
            src={url}
            alt={visibleCaption ?? "Foto"}
            draggable={false}
            onError={() => setError(true)}
            className="pointer-events-none block w-full object-cover"
          />
        </div>
      ) : error ? (
        <div className="grid h-32 place-items-center bg-muted text-xs text-muted-foreground">
          Imagem indisponível
        </div>
      ) : (
        <div className="h-32 bg-muted" />
      )}
    </button>
  );
}
