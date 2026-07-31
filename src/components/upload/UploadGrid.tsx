import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaFile } from "@/lib/upload";
import { UploadPreview } from "./UploadPreview";

interface UploadGridProps {
  files: MediaFile[];
  onRemove?: (id: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
  maxFiles?: number;
}

export function UploadGrid({ files, onRemove, onMove, maxFiles }: UploadGridProps) {
  const cols = files.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={cn("grid gap-2 group", cols)}>
      {files.slice(0, maxFiles).map((file, index) => (
        <div key={file.id} className="relative">
          <UploadPreview file={file} onRemove={onRemove} />
          {onMove && (
            <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(file.id, -1);
                }}
                disabled={index === 0}
                aria-label="Mover para a esquerda"
                className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(file.id, 1);
                }}
                disabled={index === files.length - 1}
                aria-label="Mover para a direita"
                className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
