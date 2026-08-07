import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import { PremiumCardView } from "@/components/feed/cards/premium-card";
import type { PremiumCard } from "@/lib/feed/home-premium";
import type { RecommendationsSectionData } from "@/lib/feed/feed-types";

interface FeedRecommendationsProps {
  data: { items: Array<RecommendationsSectionData["items"][number] | PremiumCard> };
}

const RECOMMENDATIONS_CARD_WIDTH = { mobile: 240, tablet: 248, desktop: 256 } as const;
const RECOMMENDATIONS_CARD_HEIGHT = 380;

export function FeedRecommendations({ data }: FeedRecommendationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              💡
            </span>
            <h3 className="font-display text-base font-bold truncate">Recomendações</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Feed inteligente curado para você
          </p>
        </div>
        <Link
          to="/recommendations"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        section="recommendations"
        items={data.items}
        cardWidths={RECOMMENDATIONS_CARD_WIDTH}
        cardHeight={RECOMMENDATIONS_CARD_HEIGHT}
        renderCard={(item) => {
          if ("kind" in item) {
            return <PremiumCardView card={item} compact />;
          }

          const legacy = item as RecommendationsSectionData["items"][number];

          return (
            <Link
              to={legacy.route}
              className="block h-full rounded-[24px] overflow-hidden transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
            >
              <div className="flex h-full flex-col gap-2 rounded-[24px] border border-border/50 bg-surface p-6 shadow-soft">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-3xl">
                  {legacy.icon}
                </span>
                <div className="font-display font-bold text-[15px] leading-snug">
                  {legacy.title}
                </div>
                <div className="text-xs text-muted-foreground">{legacy.description}</div>
                <div className="mt-auto h-12 w-full rounded-full bg-primary/10 text-primary text-[13px] font-semibold grid place-items-center transition-colors hover:bg-primary/20">
                  Explorar
                </div>
              </div>
            </Link>
          );
        }}
      />
    </motion.div>
  );
}
