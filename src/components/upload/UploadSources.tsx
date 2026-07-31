import { useCallback, useRef } from "react";
import { Camera, Image, FolderOpen, Video, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadMode } from "@/lib/upload";

const PERMISSION_KEY = "connexy.media.permission.granted";

interface UploadSourcesProps {
  mode: UploadMode;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
  disabled?: boolean;
  className?: string;
}

interface SourceOption {
  id: string;
  label: string;
  icon: typeof Camera;
  accept: string;
  capture?: "user" | "environment";
  multiple?: boolean;
  kind: "photo" | "video" | "mixed";
  audio?: boolean;
}

function getOptions(mode: UploadMode, multiple: boolean): SourceOption[] {
  if (mode === "video") {
    return [
      {
        id: "record-video",
        label: "Gravar vídeo",
        icon: Video,
        accept: "video/*",
        capture: "environment",
        kind: "video",
        audio: true,
      },
      {
        id: "choose-video",
        label: "Escolher vídeo",
        icon: FileVideo,
        accept: "video/*",
        multiple,
        kind: "video",
      },
    ];
  }

  const photoSources: SourceOption[] = [
    {
      id: "take-photo",
      label: "Tirar foto",
      icon: Camera,
      accept: "image/*",
      capture: "environment",
      kind: "photo",
      audio: true,
    },
    {
      id: "gallery",
      label: "Galeria",
      icon: Image,
      accept: "image/*",
      multiple,
      kind: "photo",
    },
  ];

  if (mode === "mixed") {
    return [
      ...photoSources,
      {
        id: "record-video",
        label: "Gravar vídeo",
        icon: Video,
        accept: "video/*",
        capture: "environment",
        kind: "video",
        audio: true,
      },
      {
        id: "choose-video",
        label: "Escolher vídeo",
        icon: FileVideo,
        accept: "video/*",
        multiple,
        kind: "video",
      },
      {
        id: "archive",
        label: "Arquivo",
        icon: FolderOpen,
        accept: "image/*,video/*",
        multiple,
        kind: "mixed",
      },
    ];
  }

  return [
    ...photoSources,
    {
      id: "archive",
      label: "Arquivo",
      icon: FolderOpen,
      accept: "image/*",
      multiple,
      kind: "photo",
    },
  ];
}

async function requestPermission(audio: boolean) {
  try {
    if (localStorage.getItem(PERMISSION_KEY)) return;
    const constraints: MediaStreamConstraints = audio
      ? { video: true, audio: true }
      : { video: true };
    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach((t) => t.stop());
    localStorage.setItem(PERMISSION_KEY, "true");
  } catch {
    // Permission denied or unavailable — the native picker still opens.
  }
}

export function UploadSources({
  mode,
  multiple,
  onFiles,
  disabled,
  className,
}: UploadSourcesProps) {
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const options = getOptions(mode, multiple ?? false);

  const handleClick = useCallback(
    (option: SourceOption) => {
      if (disabled) return;
      void requestPermission(!!option.audio);
      inputsRef.current[option.id]?.click();
    },
    [disabled],
  );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleClick(option)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary active:scale-[0.97]",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {option.label}
          </button>
        );
      })}

      {options.map((option) => (
        <input
          key={`input-${option.id}`}
          ref={(el) => {
            inputsRef.current[option.id] = el;
          }}
          type="file"
          accept={option.accept}
          capture={option.capture}
          multiple={option.multiple}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) {
              onFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      ))}
    </div>
  );
}
