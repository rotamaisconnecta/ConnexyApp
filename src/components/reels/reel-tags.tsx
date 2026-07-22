import type { ReelCategoryValue } from "@/lib/reels/reel-types";
import { getCategoryEmoji, getCategoryLabel, getCategoryColor } from "@/lib/reels/reel-utils";
import { cn } from "@/lib/utils";

interface ReelTagsProps {
  category: ReelCategoryValue;
  hashtags: string[];
}

export function ReelTags({ category, hashtags }: ReelTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
          getCategoryColor(category),
        )}
      >
        <span>{getCategoryEmoji(category)}</span>
        {getCategoryLabel(category)}
      </span>
      {hashtags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
