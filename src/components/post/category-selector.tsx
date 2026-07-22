import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type PostCategoryValue, PostCategory, POST_CATEGORY_META } from "@/lib/types/post";
import { chipContainer, chipItem } from "@/components/profile/animations";

interface CategorySelectorProps {
  value: PostCategoryValue | null;
  onChange: (category: PostCategoryValue) => void;
}

const CATEGORIES = Object.values(PostCategory);

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <motion.div
      variants={chipContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-5 gap-2"
    >
      {CATEGORIES.map((cat) => {
        const meta = POST_CATEGORY_META[cat];
        const active = value === cat;
        return (
          <motion.button
            key={cat}
            type="button"
            variants={chipItem}
            onClick={() => onChange(cat)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-colors",
              active
                ? "border-primary bg-accent text-primary"
                : "border-border bg-surface text-muted-foreground hover:border-primary/40",
            )}
            aria-label={meta.label}
            aria-pressed={active}
          >
            <span className="text-lg">{meta.emoji}</span>
            <span className="text-[10px] font-semibold leading-tight">{meta.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
