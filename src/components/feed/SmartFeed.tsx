import { useMemo, useState, useCallback, useContext } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { ContextEngineContext } from "@/lib/context/context-provider";
import { buildFeed } from "@/lib/feed/feed-builder";
import { useLiveUpdates } from "@/lib/live/live-hooks";
import { LIVE_EVENT_META } from "@/lib/live/live-events";
import { FeedHero } from "./FeedHero";
import { FeedHotArea } from "./FeedHotArea";
import { FeedRecommendations } from "./FeedRecommendations";
import { FeedNearbyPeople } from "./FeedNearbyPeople";
import { FeedNearbyEvents } from "./FeedNearbyEvents";
import { FeedNearbyPlaces } from "./FeedNearbyPlaces";
import { FeedNearbyBusinesses } from "./FeedNearbyBusinesses";
import { FeedNearbyDrivers } from "./FeedNearbyDrivers";
import { FeedTrending } from "./FeedTrending";
import { FeedFooter } from "./FeedFooter";
import type {
  HeroSectionData,
  HotAreaSectionData,
  RecommendationsSectionData,
  NearbyPeopleSectionData,
  NearbyPlacesSectionData,
  NearbyEventsSectionData,
  NearbyBusinessesSectionData,
  NearbyDriversSectionData,
  TrendingSectionData,
  FooterSectionData,
} from "@/lib/feed/feed-types";

function useContextEngineSafe() {
  const ctx = useContext(ContextEngineContext);
  if (!ctx) return null;
  return ctx.state;
}

export function SmartFeed() {
  const [feedError, setFeedError] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const { lastEvent } = useLiveUpdates(20);

  const rebuildFeed = useCallback(() => {
    setFeedKey((k) => k + 1);
  }, []);

  const state = useContextEngineSafe();

  const sections = useMemo(() => {
    if (!state) return [];
    try {
      void feedKey;
      return buildFeed(state);
    } catch {
      return [];
    }
  }, [state, feedKey]);

  if (!state || feedError) {
    return (
      <div className="mx-4 p-6 rounded-3xl bg-surface border border-border shadow-soft text-center">
        <p className="text-sm text-muted-foreground">Feed temporariamente indisponível.</p>
        <button
          type="button"
          onClick={() => {
            setFeedError(false);
            setFeedKey((k) => k + 1);
          }}
          className="mt-3 rounded-full bg-gradient-brand px-5 py-2 text-xs font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="mx-4 p-6 rounded-3xl bg-surface border border-border shadow-soft text-center">
        <p className="text-sm text-muted-foreground">Erro ao montar feed.</p>
        <button
          type="button"
          onClick={() => setFeedKey((k) => k + 1)}
          className="mt-3 rounded-full bg-gradient-brand px-5 py-2 text-xs font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const livePulse = lastEvent ? (LIVE_EVENT_META[lastEvent.type] ?? null) : null;

  return (
    <LayoutGroup>
      <div className="space-y-5 pb-6">
        <AnimatePresence>
          {livePulse && (
            <motion.div
              key={`pulse-${lastEvent!.id}`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mx-4 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-semibold text-primary">{livePulse.emoji}</span>
              <span className="text-xs text-foreground font-medium">{livePulse.label}</span>
              <button
                type="button"
                onClick={rebuildFeed}
                className="ml-auto text-[10px] text-primary font-semibold hover:underline"
              >
                Atualizar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{
              duration: 0.35,
              delay: index * 0.06,
              ease: "easeOut",
              layout: { type: "spring", stiffness: 300, damping: 30 },
            }}
          >
            <SectionRenderer section={section} />
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
}

function SectionRenderer({ section }: { section: ReturnType<typeof buildFeed>[number] }) {
  switch (section.type) {
    case "HERO":
      return <FeedHero data={section.data as HeroSectionData} />;
    case "HOT_AREA":
      return <FeedHotArea data={section.data as HotAreaSectionData} />;
    case "RECOMMENDATIONS":
      return <FeedRecommendations data={section.data as RecommendationsSectionData} />;
    case "NEARBY_PEOPLE":
      return <FeedNearbyPeople data={section.data as NearbyPeopleSectionData} />;
    case "NEARBY_PLACES":
      return <FeedNearbyPlaces data={section.data as NearbyPlacesSectionData} />;
    case "NEARBY_EVENTS":
    case "NEARBY_EVENTS_TODAY":
    case "NEARBY_EVENTS_UPCOMING":
      return (
        <FeedNearbyEvents data={section.data as NearbyEventsSectionData} title={section.title} />
      );
    case "NEARBY_BUSINESSES":
      return <FeedNearbyBusinesses data={section.data as NearbyBusinessesSectionData} />;
    case "NEARBY_DRIVERS":
      return <FeedNearbyDrivers data={section.data as NearbyDriversSectionData} />;
    case "TRENDING":
      return <FeedTrending data={section.data as TrendingSectionData} />;
    case "FOOTER":
      return <FeedFooter data={section.data as FooterSectionData} />;
    default:
      return null;
  }
}
