import {
  AD_PLACEMENTS,
  summarizeAdMetrics,
  type AdMetricEvent,
} from "@/lib/ads/ad-metrics";

export const ADMIN_AD_PLACEMENTS = [
  { id: AD_PLACEMENTS.HOME_REGIONAL_HIGHLIGHTS, label: "Destaques da região" },
  { id: AD_PLACEMENTS.POST_RIDE_DISCOVERY, label: "Descoberta pós-viagem" },
  { id: AD_PLACEMENTS.HOME_PREMIUM, label: "Home Premium" },
] as const;

export function getAdCtrPercent(impressions: number, clicks: number): number {
  if (!Number.isFinite(impressions) || impressions <= 0 || !Number.isFinite(clicks)) return 0;
  return (clicks / impressions) * 100;
}

export function buildAdminAdOverview(events: readonly AdMetricEvent[]) {
  const summary = summarizeAdMetrics(events);
  return {
    ...summary,
    ctrPercent: getAdCtrPercent(summary.impressions, summary.clicks),
    period: events.length === 0
      ? null
      : {
          from: events.reduce((earliest, event) => Date.parse(event.at) < Date.parse(earliest) ? event.at : earliest, events[0].at),
          to: events.reduce((latest, event) => Date.parse(event.at) > Date.parse(latest) ? event.at : latest, events[0].at),
        },
    placements: ADMIN_AD_PLACEMENTS.map(({ id, label }) => ({
      id,
      label,
      ...(summary.byPlacement[id] ?? { impressions: 0, clicks: 0 }),
    })),
  };
}
