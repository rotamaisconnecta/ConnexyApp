import { motion } from "framer-motion";
import { sheetItem } from "./navigation-animations";

interface CreateSheetItemProps {
  emoji: string;
  label: string;
  description: string;
  index: number;
  onSelect?: (category: string) => void;
}

export function CreateSheetItem({
  emoji,
  label,
  description,
  index,
  onSelect,
}: CreateSheetItemProps) {
  return (
    <motion.button
      custom={index}
      variants={sheetItem}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      onClick={() => onSelect?.(label)}
      aria-label={`Criar ${label}`}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface shadow-soft hover:shadow-elevated transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="h-16 w-16 rounded-full bg-white shadow-soft grid place-items-center text-3xl">
        {emoji}
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold leading-tight">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{description}</div>
      </div>
    </motion.button>
  );
}
