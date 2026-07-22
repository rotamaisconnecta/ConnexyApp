import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatReelCount } from "@/lib/reels/reel-utils";

interface ReelLikesProps {
  count: number;
  liked: boolean;
  onToggle: () => void;
}

export function ReelLikes({ count, liked, onToggle }: ReelLikesProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5"
      aria-label={liked ? "Remover curtida" : "Curtir"}
    >
      <span className="relative h-10 w-10 grid place-items-center">
        <AnimatePresence>
          {liked && (
            <motion.span
              key="ring"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-pink-500"
            />
          )}
        </AnimatePresence>
        <Heart
          className={cn(
            "h-6 w-6 transition-colors",
            liked ? "fill-pink-500 text-pink-500" : "text-white",
          )}
        />
      </span>
      <span className="text-[11px] font-semibold text-white drop-shadow">
        {formatReelCount(count)}
      </span>
    </button>
  );
}
