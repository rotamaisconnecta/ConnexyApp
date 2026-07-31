import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  MediaFile,
  UploadMode,
  createMediaFile,
  validateSize,
  validateExtension,
  compressImage,
  PHOTO_VALIDATION,
  VIDEO_VALIDATION,
  PHOTO_ACCEPT,
  VIDEO_ACCEPT,
  MIXED_ACCEPT,
  MAX_GRID_FILES,
  revokePreview,
} from "@/lib/upload";
import { UploadDropzone } from "./UploadDropzone";
import { UploadPreview } from "./UploadPreview";
import { UploadGrid } from "./UploadGrid";
import { UploadToolbar } from "./UploadToolbar";
import { UploadProgress } from "./UploadProgress";
import { UploadSources } from "./UploadSources";

interface UploadMediaProps {
  mode?: UploadMode;
  multiple?: boolean;
  maxFiles?: number;
  value?: MediaFile[];
  onChange?: (files: MediaFile[]) => void;
  onRemove?: (id: string) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function UploadMedia({
  mode = "photo",
  multiple = false,
  maxFiles,
  value,
  onChange,
  onRemove,
  className,
  disabled,
  label,
}: UploadMediaProps) {
  const [internalFiles, setInternalFiles] = useState<MediaFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const files = value ?? internalFiles;
  const effectiveMax = maxFiles ?? (multiple ? MAX_GRID_FILES : 1);

  const accept = mode === "photo" ? PHOTO_ACCEPT : mode === "video" ? VIDEO_ACCEPT : MIXED_ACCEPT;

  const validation = mode === "video" ? VIDEO_VALIDATION : PHOTO_VALIDATION;

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const incoming: MediaFile[] = [];
      const remaining = effectiveMax - files.length;
      const items = Array.from(fileList).slice(0, remaining);

      for (const file of items) {
        if (!validateSize(file, validation.maxSize)) continue;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!validateExtension(ext, validation.allowedExtensions)) continue;

        let processed = file;
        if (file.type.startsWith("image/")) {
          processed = await compressImage(file);
        }

        incoming.push(createMediaFile(processed));
      }

      if (incoming.length === 0) return;

      const updated = multiple ? [...files, ...incoming] : incoming.slice(0, 1);

      if (!value) setInternalFiles(updated);
      onChange?.(updated);
    },
    [files, value, onChange, multiple, effectiveMax, validation],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onRemove?.(id);
      if (!value) {
        setInternalFiles((prev) => {
          const file = prev.find((f) => f.id === id);
          if (file) revokePreview(file.preview);
          return prev.filter((f) => f.id !== id);
        });
      }
    },
    [value, onRemove],
  );

  const handleRemoveAll = useCallback(() => {
    files.forEach((f) => revokePreview(f.preview));
    if (!value) setInternalFiles([]);
    onChange?.([]);
  }, [files, value, onChange]);

  const handleMove = useCallback(
    (id: string, dir: -1 | 1) => {
      const index = files.findIndex((f) => f.id === id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= files.length) return;
      const updated = [...files];
      const [moved] = updated.splice(index, 1);
      updated.splice(target, 0, moved);
      if (!value) setInternalFiles(updated);
      onChange?.(updated);
    },
    [files, value, onChange],
  );

  const handleReplace = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleReplaceFiles = useCallback(
    async (fileList: FileList) => {
      const file = fileList[0];
      if (!file) return;
      if (!validateSize(file, validation.maxSize)) return;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!validateExtension(ext, validation.allowedExtensions)) return;

      let processed = file;
      if (file.type.startsWith("image/")) {
        processed = await compressImage(file);
      }

      const newFile = createMediaFile(processed);
      if (files[0]) revokePreview(files[0].preview);
      const updated = [newFile];

      if (!value) setInternalFiles(updated);
      onChange?.(updated);
    },
    [files, value, onChange, validation],
  );

  const simulateUpload = useCallback(() => {
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (!value) {
        internalFiles.forEach((f) => revokePreview(f.preview));
      }
    };
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      <UploadSources mode={mode} multiple={multiple} onFiles={handleFiles} disabled={disabled} />

      {files.length === 0 ? (
        <UploadDropzone
          mode={mode}
          multiple={multiple}
          accept={accept}
          onFiles={handleFiles}
          disabled={disabled}
        />
      ) : multiple ? (
        <UploadGrid
          files={files}
          onRemove={handleRemove}
          onMove={handleMove}
          maxFiles={effectiveMax}
        />
      ) : (
        <UploadPreview file={files[0]} onRemove={handleRemove} />
      )}

      {multiple && files.length > 0 && (
        <UploadDropzone
          mode={mode}
          multiple={multiple}
          accept={accept}
          onFiles={handleFiles}
          disabled={disabled || files.length >= effectiveMax}
        />
      )}

      <div className="flex items-center justify-between">
        <UploadToolbar
          fileCount={files.length}
          maxFiles={effectiveMax}
          onAdd={
            multiple && files.length < effectiveMax ? () => inputRef.current?.click() : undefined
          }
          onReplace={!multiple && files.length === 1 ? handleReplace : undefined}
          onRemoveAll={files.length > 0 ? handleRemoveAll : undefined}
        />

        {!uploading && files.length > 0 && (
          <button
            type="button"
            onClick={simulateUpload}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Simular Upload
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files?.length) {
            if (!multiple && files.length === 1) {
              handleReplaceFiles(e.target.files);
            } else {
              handleFiles(e.target.files);
            }
            e.target.value = "";
          }
        }}
        className="hidden"
        disabled={disabled}
      />

      {uploading && <UploadProgress progress={progress} />}
    </div>
  );
}
