import { motion } from "framer-motion";
import type { HeroSectionData } from "@/lib/feed/feed-types";

interface FeedHeroProps {
  data: HeroSectionData;
}

export function FeedHero({ data }: FeedHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-lilac/10 border border-primary/15 p-5 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0" aria-hidden>
          {data.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-foreground leading-tight">
            {data.message}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
