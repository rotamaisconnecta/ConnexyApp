import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface ReactionPickerProps {
  reactions: string[];
  onSelect: (emoji: string) => void;
  selected?: string;
  className?: string;
}

export function ReactionPicker({ reactions, onSelect, selected, className }: ReactionPickerProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {reactions.map((emoji) => {
        const isSelected = selected === emoji;

        return (
          <motion.button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            whileTap={{ scale: 0.9 }}
            animate={isSelected ? { scale: 1.15 } : { scale: 1 }}
            className={cn("h-10 w-10 flex items-center justify-center text-xl transition-colors")}
            style={{
              borderRadius: Radius.floating,
              backgroundColor: isSelected ? Colors.brand.light : "transparent",
            }}
          >
            {emoji}
          </motion.button>
        );
      })}
    </div>
  );
}
