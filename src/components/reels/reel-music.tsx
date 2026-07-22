import { Music } from "lucide-react";
import { motion } from "framer-motion";
import type { ReelMusic as ReelMusicType } from "@/lib/reels/reel-types";

interface ReelMusicProps {
  music: ReelMusicType | null;
}

export function ReelMusic({ music }: ReelMusicProps) {
  if (!music) return null;

  const label = `${music.title} — ${music.artist}`;

  return (
    <div className="flex items-center gap-2 text-white/90 text-xs">
      <Music className="h-3.5 w-3.5 shrink-0" />
      <div className="overflow-hidden whitespace-nowrap max-w-[70%]">
        <motion.span
          className="inline-block"
          animate={{ x: [0, -120, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {label}
        </motion.span>
      </div>
    </div>
  );
}
