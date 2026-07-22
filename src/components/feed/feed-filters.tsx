import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { chipContainer, chipItem } from "@/components/profile/animations";
import { type FeedFilterValue, FEED_FILTER_OPTIONS } from "@/lib/feed/feed-types";

interface FeedFiltersProps {
  value: FeedFilterValue;
  onChange: (filter: FeedFilterValue) => void;
}

export function FeedFilters({ value, onChange }: FeedFiltersProps) {
  return (
    <motion.div
      variants={chipContainer}
      initial="hidden"
      animate="visible"
      className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
    >
      {FEED_FILTER_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            variants={chipItem}
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              active
                ? "bg-gradient-brand text-white shadow-soft"
                : "bg-secondary text-muted-foreground hover:bg-accent",
            )}
            aria-pressed={active}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
