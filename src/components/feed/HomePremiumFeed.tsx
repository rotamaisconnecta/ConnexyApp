import { memo } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { FeedNearbyEvents } from "./FeedNearbyEvents";
import { FeedNearbyPlaces } from "./FeedNearbyPlaces";
import { buildEventsUpcoming, buildNearbyPlaces } from "@/lib/feed/home-premium";

function PremiumSection({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
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
      <div className="space-y-8">
        <PremiumSection index={0}>
          <FeedNearbyPlaces data={buildNearbyPlaces()} />
        </PremiumSection>

        <PremiumSection index={1}>
          <FeedNearbyEvents
            data={buildEventsUpcoming()}
            title="Próximos eventos"
            section="events-upcoming"
          />
        </PremiumSection>
      </div>
    </LayoutGroup>
  );
});
