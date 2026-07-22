import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sheetItem } from "./navigation-animations";

interface CreateSheetItemProps {
  emoji: string;
  label: string;
  description: string;
  index: number;
  onSelect?: (label: string) => void;
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
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect?.(label)}
      aria-label={`Criar ${label}`}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span className="text-3xl">{emoji}</span>
      <div className="text-center">
        <div className="text-xs font-semibold">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
      </div>
    </motion.button>
  );
}
