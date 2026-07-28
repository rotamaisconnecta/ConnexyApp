import { motion } from "framer-motion";
import { TrendingUp, Minus, Sparkles } from "lucide-react";
import type { TrendingSectionData } from "@/lib/feed/feed-types";

interface FeedTrendingProps {
  data: TrendingSectionData;
}

const TREND_ICONS = {
  up: TrendingUp,
  stable: Minus,
  new: Sparkles,
} as const;

const TREND_COLORS = {
  up: "text-green-500",
  stable: "text-muted-foreground",
  new: "text-primary",
} as const;

const TREND_LABELS = {
  up: "Subindo",
  stable: "Estavel",
  new: "Novo",
} as const;

export function FeedTrending({ data }: FeedTrendingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-4"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm" aria-hidden>
          📈
        </span>
        <h3 className="font-display text-base font-bold">Em Alta</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {data.items.map((item) => {
          const TrendIcon = TREND_ICONS[item.trend];
          const trendColor = TREND_COLORS[item.trend];
          const trendLabel = TREND_LABELS[item.trend];

          return (
            <div
              key={item.id}
              className="shrink-0 w-36 rounded-xl border border-border bg-surface p-3 shadow-soft transition-all duration-200 hover:shadow-elegant"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg" aria-hidden>
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <div className="font-display font-bold text-xs truncate">{item.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                    <span className={`text-[10px] font-semibold ${trendColor}`}>{trendLabel}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {item.count} participacoes
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
