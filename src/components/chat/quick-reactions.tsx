import { motion } from "framer-motion";
import { QUICK_REACTIONS, type QuickReaction } from "@/lib/chat/chat-types";

interface QuickReactionsProps {
  messageId: string;
  currentReaction?: QuickReaction;
  onSelect: (messageId: string, reaction: QuickReaction) => void;
}

export function QuickReactions({ messageId, currentReaction, onSelect }: QuickReactionsProps) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {QUICK_REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onSelect(messageId, emoji)}
          className={`h-7 w-7 rounded-full grid place-items-center text-sm transition-colors ${
            currentReaction === emoji ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-accent"
          }`}
          aria-label={`Reagir com ${emoji}`}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
