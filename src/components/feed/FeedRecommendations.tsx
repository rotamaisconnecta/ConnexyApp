import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { RecommendationsSectionData } from "@/lib/feed/feed-types";

interface FeedRecommendationsProps {
  data: RecommendationsSectionData;
}

export function FeedRecommendations({ data }: FeedRecommendationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-4"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm" aria-hidden>
          ✨
        </span>
        <h3 className="font-display text-base font-bold">Recomendacoes</h3>
      </div>

      <div className="space-y-2">
        {data.items.map((item) => (
          <Link
            key={item.id}
            to={item.route}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-soft transition-all duration-200 hover:shadow-elegant active:scale-[0.98]"
          >
            <span className="h-10 w-10 grid place-items-center rounded-xl bg-accent/50 text-lg shrink-0">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm truncate">{item.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
