import { useCallback, useRef, useState } from "react";
import { Upload, X, Film, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

interface UploadMediaProps {
  accept?: string;
  label?: string;
  multiple?: boolean;
  maxFiles?: number;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  className?: string;
}

export function UploadMedia({
  accept = "image/*",
  label = "Adicionar mídia",
  multiple = false,
  maxFiles = 1,
  value,
  onChange,
  className,
}: UploadMediaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const files = value ?? internalFiles;

  const updateFiles = useCallback(
    (newFiles: UploadedFile[]) => {
      if (onChange) {
        onChange(newFiles);
      } else {
        setInternalFiles(newFiles);
      }
    },
    [onChange],
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const remaining = maxFiles - files.length;
      const valid = Array.from(fileList).slice(0, remaining);

      const newItems: UploadedFile[] = valid.map((file) => {
        const mediaType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
        return {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          type: mediaType,
        };
      });

      updateFiles([...files, ...newItems]);
    },
    [files, maxFiles, updateFiles],
  );

  const remove = useCallback(
    (id: string) => {
      const target = files.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      updateFiles(files.filter((f) => f.id !== id));
    },
    [files, updateFiles],
  );

  const replace = useCallback(
    (id: string, fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];
      const target = files.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      const updated = files.map((f) =>
        f.id === id
          ? {
              ...f,
              file,
              preview: URL.createObjectURL(file),
              type: (file.type.startsWith("video/") ? "video" : "image") as "image" | "video",
            }
          : f,
      );
      updateFiles(updated);
    },
    [files, updateFiles],
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
    <div className={cn("space-y-3", className)}>
      {files.length < maxFiles && (
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
            "w-full rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver
              ? "border-primary bg-accent"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
          )}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">
            {dragOver ? "Solte o arquivo aqui" : "Arraste ou clique para enviar"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label={label}
      />

      {files.length > 0 && (
        <div className={cn("grid gap-2", files.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {files.map((item) => (
            <div key={item.id} className="relative group aspect-video">
              {item.type === "image" ? (
                <img
                  src={item.preview}
                  alt="Preview"
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-xl bg-foreground/5 grid place-items-center">
                  <video
                    src={item.preview}
                    className="h-full w-full rounded-xl object-cover"
                    controls
                  />
                </div>
              )}
              <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-foreground/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/90"
                aria-label="Remover mídia"
              >
                <X className="h-4 w-4" />
              </button>
              {item.type === "image" ? (
                <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="h-3 w-3 inline mr-1" />
                  Trocar
                </span>
              ) : (
                <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <Film className="h-3 w-3 inline mr-1" />
                  Trocar
                </span>
              )}
              <input
                type="file"
                accept={accept}
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => replace(item.id, e.target.files)}
                aria-label="Trocar mídia"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
