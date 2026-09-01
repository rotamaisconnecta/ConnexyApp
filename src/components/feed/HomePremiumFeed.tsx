import { memo, useCallback, useEffect, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { FeedNearbyPeople } from "./FeedNearbyPeople";
import { FeedNearbyEvents } from "./FeedNearbyEvents";
import { FeedNearbyPlaces } from "./FeedNearbyPlaces";
import { buildEventsUpcoming, buildNearbyPeople, buildNearbyPlaces } from "@/lib/feed/home-premium";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { DiscoveryService } from "@/services/discovery.service";
import type { NearbyProfile } from "@/types/phase-13b";

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

function PeopleSectionSkeleton() {
  return (
    <div className="space-y-3 px-6">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="w-40 shrink-0 overflow-hidden rounded-[20px] border border-border/50 bg-surface"
          >
            <div className="h-28 animate-pulse bg-muted" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="flex gap-1">
                <div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar");
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
      <div className="space-y-8">
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
          <FeedNearbyPlaces data={buildNearbyPlaces()} />
        </PremiumSection>

        <PremiumSection index={2}>
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
