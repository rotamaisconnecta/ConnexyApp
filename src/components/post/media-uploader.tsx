import { useCallback, useRef, useState } from "react";
import { Upload, X, Film, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PostMedia,
  MAX_MEDIA_FILES,
  ALLOWED_MEDIA_TYPES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/types/post";

interface MediaUploaderProps {
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
}

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_MEDIA_FILES - media.length;
      const valid = Array.from(files)
        .slice(0, remaining)
        .filter((f) => ALLOWED_MEDIA_TYPES.includes(f.type));

      const newMedia: PostMedia[] = valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        type: ALLOWED_IMAGE_TYPES.includes(file.type) ? "image" : "video",
      }));

      onChange([...media, ...newMedia]);
    },
    [media, onChange],
  );

  const remove = useCallback(
    (id: string) => {
      const target = media.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      onChange(media.filter((m) => m.id !== id));
    },
    [media, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return (
    <div className="space-y-3">
      {media.length < MAX_MEDIA_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "w-full rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            dragOver
              ? "border-primary bg-accent"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
          )}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">Arraste imagens</p>
          <p className="mt-1 text-xs text-muted-foreground">ou</p>
          <p className="mt-1 text-sm font-semibold text-primary">Selecionar arquivos</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            jpg, png, webp, mp4, mov · Até {MAX_MEDIA_FILES} arquivos
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_MEDIA_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="Selecionar arquivos de mídia"
      />

      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map((m) => (
            <div key={m.id} className="relative group aspect-square">
              {m.type === "image" ? (
                <img
                  src={m.preview}
                  alt="Preview"
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-xl bg-foreground/5 grid place-items-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-foreground/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover mídia"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {m.type === "video" && (
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] text-white font-medium">
                  Vídeo
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
