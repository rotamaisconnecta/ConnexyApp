import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { EngineDashboard } from "@/components/engine/engine-dashboard";
import { EngineLoading } from "@/components/engine/engine-loading";
import { EngineEmpty } from "@/components/engine/engine-empty";
import { TrendingBanner } from "@/components/engine/trending-banner";
import { RecommendationChip } from "@/components/engine/recommendation-chip";
import { mockUser, mockContext, mockRecommendations } from "@/lib/engine/engine-mocks";
import { getDashboardData, type DashboardData } from "@/lib/engine/engine";
import { sortRecommendations } from "@/lib/engine/engine-ranking";
import { buildContext } from "@/lib/engine/engine-context";
import type { Recommendation } from "@/lib/engine/engine-types";

export const Route = createFileRoute("/_app/engine")({
  head: () => ({ meta: [{ title: "Engine — Connexy" }] }),
  component: EnginePage,
});

function EnginePage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const context = useMemo(() => buildContext(mockUser), []);

  const enrichedRecommendations = useMemo(() => {
    return sortRecommendations(
      mockRecommendations.map((r) => ({
        ...r,
        score: { ...r.score, total: r.score.total },
      })),
    );
  }, []);

  const dashboardData = useMemo<DashboardData>(() => {
    const state = {
      user: mockUser,
      context,
      recommendations: enrichedRecommendations,
      trending: { places: [], events: [], businesses: [], people: [], drivers: [] },
    };
    return getDashboardData(state);
  }, [context, enrichedRecommendations]);

  const trendingItems = useMemo(
    () => enrichedRecommendations.filter((r) => r.trending),
    [enrichedRecommendations],
  );

  const [loading] = useState(false);

  function handleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex-1 pb-20">
        <StatusBar />
        <EngineLoading />
      </div>
    );
  }

  const totalItems = enrichedRecommendations.length;
  if (totalItems === 0) {
    return (
      <div className="flex-1 pb-20">
        <StatusBar />
        <EngineEmpty message="Nenhuma recomendacao disponivel no momento" />
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20">
      <StatusBar />

      <div className="space-y-3 px-4 pt-3 pb-2">
        {trendingItems.slice(0, 2).map((item) => (
          <TrendingBanner
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            activityLevel={item.activityLevel}
            emoji={item.trending ? "\u{1F525}" : "\u{1F4CB}"}
          />
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {enrichedRecommendations
            .filter((r) => selectedIds.has(r.id))
            .slice(0, 10)
            .map((rec: Recommendation) => (
              <RecommendationChip key={rec.id} recommendation={rec} />
            ))}
        </div>
      )}

      <EngineDashboard data={dashboardData} />
    </div>
  );
}
