import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelCommentInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function ReelCommentInput({
  value,
  onChange,
  onSubmit,
  placeholder,
}: ReelCommentInputProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && value.trim()) {
      onSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Comentar…"}
        className={cn(
          "flex-1 h-10 rounded-full bg-secondary px-4 text-sm text-foreground",
          "outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground",
        )}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="h-10 w-10 grid place-items-center rounded-full bg-gradient-brand text-white disabled:opacity-40"
        aria-label="Enviar comentário"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
