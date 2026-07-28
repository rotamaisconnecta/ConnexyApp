import { motion } from "framer-motion";
import type { HotAreaSectionData } from "@/lib/feed/feed-types";

interface FeedHotAreaProps {
  data: HotAreaSectionData;
}

const LEVEL_STYLES: Record<string, string> = {
  CALMO: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
  NORMAL: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
  MOVIMENTADO: "from-orange-500/10 to-orange-600/5 border-orange-500/20",
  BOMBANDO: "from-red-500/10 to-pink-500/5 border-red-500/20",
};

const LEVEL_TEXT: Record<string, string> = {
  CALMO: "text-blue-600",
  NORMAL: "text-amber-600",
  MOVIMENTADO: "text-orange-600",
  BOMBANDO: "text-red-600",
};

export function FeedHotArea({ data }: FeedHotAreaProps) {
  const gradient = LEVEL_STYLES[data.level] ?? LEVEL_STYLES.NORMAL;
  const textColor = LEVEL_TEXT[data.level] ?? LEVEL_TEXT.NORMAL;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`mx-4 rounded-2xl bg-gradient-to-r ${gradient} border p-4 shadow-soft`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0" aria-hidden>
          {data.emoji}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-foreground">Movimento</h3>
            <span className={`text-xs font-semibold ${textColor}`}>{data.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{data.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
