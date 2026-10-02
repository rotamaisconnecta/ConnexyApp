import { FileText, Loader2 } from "lucide-react";
import { formatFileSize } from "@/lib/chat/chat-format";

interface FileMessageProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  sending?: boolean;
  selecting?: boolean;
  onOpen?: () => void;
}

function fileExtension(fileName: string, mimeType: string): string | undefined {
  const fromName = fileName.includes(".") ? fileName.split(".").pop() : undefined;
  if (fromName && fromName.length <= 8) return fromName.toUpperCase();
  const subtype = mimeType.split("/")[1];
  return subtype && subtype !== "octet-stream" ? subtype.toUpperCase() : undefined;
}

export function FileMessage({
  fileName,
  fileSize,
  mimeType,
  sending = false,
  selecting = false,
  onOpen,
}: FileMessageProps) {
  const extension = fileExtension(fileName, mimeType);
  const body = (
    <>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-[10px] text-muted-foreground">
          {[extension, fileSize > 0 ? formatFileSize(fileSize) : null, sending ? "Enviando…" : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </>
  );

  if (onOpen && !sending) {
    return (
      <button
        type="button"
        onClick={(event) => {
          if (selecting) {
            event.preventDefault();
            return;
          }
          onOpen();
        }}
        className="flex min-w-0 w-full items-center gap-3 text-left"
        aria-label={selecting ? "Selecionar documento" : `Abrir ${fileName}`}
      >
        {body}
      </button>
    );
  }

  return <div className="flex min-w-0 w-full items-center gap-3">{body}</div>;
}
