import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/chat/chat-format";

interface FileMessageProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const MIME_ICONS: Record<string, string> = {
  "application/pdf": "📕",
  "application/zip": "📦",
  "application/json": "📋",
  "text/plain": "📝",
  "text/csv": "📊",
};

export function FileMessage({ fileName, fileSize, mimeType }: FileMessageProps) {
  const icon = MIME_ICONS[mimeType] ?? "📄";

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-[10px] text-muted-foreground">{formatFileSize(fileSize)}</p>
      </div>
      <button
        type="button"
        className="h-8 w-8 rounded-lg grid place-items-center hover:bg-accent transition-colors shrink-0"
        aria-label={`Baixar ${fileName}`}
      >
        <Download className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
