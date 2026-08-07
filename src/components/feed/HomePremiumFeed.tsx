import { memo } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { FeedNearbyPeople } from "./FeedNearbyPeople";
import { FeedNearbyEvents } from "./FeedNearbyEvents";
import { FeedNearbyPlaces } from "./FeedNearbyPlaces";
import { FeedTrending } from "./FeedTrending";
import { FeedRecommendations } from "./FeedRecommendations";
import { FeedFooter } from "./FeedFooter";
import {
  buildNearbyPeople,
  buildNearbyPlaces,
  buildEventsToday,
  buildEventsUpcoming,
  buildTrendingCards,
  buildRecommendationCards,
} from "@/lib/feed/home-premium";

function PremiumSection({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
        ease: "easeOut",
        layout: { type: "spring", stiffness: 300, damping: 30 },
      }}
    >
      {children}
    </motion.div>
  );
}

export const HomePremiumFeed = memo(function HomePremiumFeed() {
  return (
    <LayoutGroup>
      <div className="space-y-6">
        <PremiumSection index={0}>
          <FeedNearbyPeople data={buildNearbyPeople()} />
        </PremiumSection>

        <PremiumSection index={1}>
          <FeedNearbyEvents
            data={buildEventsUpcoming()}
            title="Eventos Próximos"
            section="events-upcoming"
          />
        </PremiumSection>

        <PremiumSection index={2}>
          <FeedNearbyPlaces data={buildNearbyPlaces()} />
        </PremiumSection>

        <PremiumSection index={3}>
          <FeedNearbyEvents
            data={buildEventsToday()}
            title="Eventos de Hoje"
            section="events-today"
          />
        </PremiumSection>

        <PremiumSection index={4}>
          <FeedTrending data={{ items: buildTrendingCards() }} />
        </PremiumSection>

        <PremiumSection index={5}>
          <FeedRecommendations data={{ items: buildRecommendationCards() }} />
        </PremiumSection>

        <FeedFooter data={{ kind: "FOOTER", message: "Seu ecossistema digital" }} />
      </div>
    </LayoutGroup>
  );
});
