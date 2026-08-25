import { memo, useCallback, useEffect, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { RefreshCw } from "lucide-react";
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
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { DiscoveryService } from "@/services/discovery.service";
import type { NearbyProfile } from "@/types/phase-13b";

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

function PeopleSectionSkeleton() {
  return (
    <div className="px-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-3 w-12 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shrink-0 w-40 rounded-[20px] border border-border/50 bg-surface overflow-hidden"
          >
            <div className="h-28 bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="flex gap-1">
                <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeopleSectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-6 py-6 text-center">
      <p className="text-xs text-muted-foreground">Não foi possível carregar pessoas próximas.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <RefreshCw className="h-3 w-3" /> Tentar novamente
      </button>
    </div>
  );
}

export const HomePremiumFeed = memo(function HomePremiumFeed() {
  const configured = isPublicSupabaseConfigured();
  const [nearbyProfiles, setNearbyProfiles] = useState<NearbyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!configured) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await DiscoveryService.getNearbyPeople(25, 10);
      setNearbyProfiles(result ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setIsLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  const showRealPeople = configured && !isLoading && !error;

  return (
    <LayoutGroup>
      <div className="space-y-6">
        <PremiumSection index={0}>
          {configured ? (
            isLoading ? (
              <PeopleSectionSkeleton />
            ) : error ? (
              <PeopleSectionError onRetry={fetchProfiles} />
            ) : showRealPeople ? (
              <FeedNearbyPeople profiles={nearbyProfiles} />
            ) : null
          ) : (
            <FeedNearbyPeople data={buildNearbyPeople()} />
          )}
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
