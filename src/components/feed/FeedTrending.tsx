import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, Minus, Sparkles } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import { PremiumCardView } from "@/components/feed/cards/premium-card";
import type { PremiumCard } from "@/lib/feed/home-premium";
import type { TrendingSectionData } from "@/lib/feed/feed-types";

interface FeedTrendingProps {
  data: { items: Array<TrendingSectionData["items"][number] | PremiumCard> };
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
  stable: "Estável",
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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              🔥
            </span>
            <h3 className="font-display text-base font-bold truncate">Em Alta</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            O que está bombando na sua região
          </p>
        </div>
        <Link
          to="/trending"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        items={data.items}
        renderCard={(item) => {
          if ("kind" in item) {
            return <PremiumCardView card={item} />;
          }

          const legacy = item as TrendingSectionData["items"][number];
          const TrendIcon = TREND_ICONS[legacy.trend];
          const trendColor = TREND_COLORS[legacy.trend];
          const trendLabel = TREND_LABELS[legacy.trend];

          return (
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all duration-300 hover:shadow-elevated h-full flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {legacy.emoji}
                </span>
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm truncate">{legacy.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                    <span className={`text-[11px] font-semibold ${trendColor}`}>{trendLabel}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {legacy.count} participações
              </div>
            </div>
          );
        }}
      />
    </motion.div>
  );
}
