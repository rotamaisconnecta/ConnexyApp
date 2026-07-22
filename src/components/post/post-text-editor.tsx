import { cn } from "@/lib/utils";
import { TEXT_MAX_LENGTH } from "@/lib/types/post";

interface PostTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function PostTextEditor({
  value,
  onChange,
  maxLength = TEXT_MAX_LENGTH,
}: PostTextEditorProps) {
  const remaining = maxLength - value.length;
  const nearLimit = remaining < 200;

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder="No que você está pensando?"
        rows={4}
        className={cn(
          "w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow",
        )}
        aria-label="Texto da publicação"
      />
      <span
        className={cn(
          "absolute bottom-2 right-3 text-[11px] font-medium tabular-nums",
          nearLimit ? "text-destructive" : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {remaining}
      </span>
    </div>
  );
}
