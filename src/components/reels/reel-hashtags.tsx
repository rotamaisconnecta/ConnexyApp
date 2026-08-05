import { cn } from "@/lib/utils";

interface ReelHashtagsProps {
  hashtags: string[];
}

export function ReelHashtags({ hashtags }: ReelHashtagsProps) {
  if (hashtags.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {hashtags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "shrink-0 rounded-full bg-secondary px-3 py-1",
            "text-xs font-medium text-muted-foreground",
          )}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
