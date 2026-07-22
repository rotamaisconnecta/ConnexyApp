import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageMessageProps {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
}

export function ImageMessage({ url, caption, width, height }: ImageMessageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden">
      {!error ? (
        <div
          className={cn("relative bg-muted animate-pulse", !loaded && "min-h-[120px]")}
          style={width && height ? { aspectRatio: `${width}/${height}` } : undefined}
        >
          <img
            src={url}
            alt={caption ?? "Imagem"}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              "w-full object-cover transition-opacity",
              loaded ? "opacity-100" : "opacity-0 absolute inset-0",
            )}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-muted rounded-2xl text-xs text-muted-foreground">
          Imagem indisponível
        </div>
      )}
      {caption && (
        <p className="px-3 py-2 text-sm whitespace-pre-wrap break-words leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  );
}
