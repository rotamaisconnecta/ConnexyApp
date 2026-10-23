/* =========================================================
   sponsored-placement.ts — Inventário de mídia para superfícies
   do produto (pós-viagem, feed, etc.).
   O frontend recebe cards já escolhidos; não decide targeting.
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

export type SponsoredTargetType = "place" | "event" | "business" | "external" | "internal";

export type PlacementSlot = "sponsored" | "organic";

/** Padrão inicial: patrocinado e orgânico se alternam. */
export const DEFAULT_PLACEMENT_PATTERN: readonly PlacementSlot[] = [
  "sponsored",
  "organic",
  "sponsored",
  "organic",
];

export type SponsoredPlacement = {
  id: string;
  advertiserId?: string;
  campaignId?: string;
  name: string;
  image: string;
  category: string;
  distanceMeters: number;
  rating?: number;
  ctaLabel?: string;
  targetType: SponsoredTargetType;
  targetId: string;
  sponsored: true;
  startsAt?: string;
  endsAt?: string;
  geoRadiusMeters?: number;
  budget?: number;
  priority?: number;
  active?: boolean;
};

export type OrganicPlacement = {
  id: string;
  name: string;
  image: string;
  category: string;
  distanceMeters: number;
  rating?: number;
  ctaLabel?: string;
  targetType: SponsoredTargetType;
  targetId: string;
  sponsored: false;
};

export type DiscoveryPlacement = SponsoredPlacement | OrganicPlacement;

export function isSponsoredPlacement(card: DiscoveryPlacement): card is SponsoredPlacement {
  return card.sponsored === true;
}

export type SponsoredSelectionOptions = {
  now?: Date;
  locationAvailable?: boolean;
};

/** Convert the existing local inventory without copying its source data. */
export function sponsoredContentToPlacement(
  ad: import("./mock-sponsored-content").SponsoredContent,
  distanceMeters = ad.distanceMeters,
): SponsoredPlacement {
  const targetType: SponsoredTargetType =
    ad.action === "view-event" ? "event" : ad.action === "view-place" ? "place" : "business";
  return {
    id: ad.id,
    advertiserId: ad.id,
    name: ad.title,
    image: ad.cover || "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
    category: ad.category,
    distanceMeters,
    ctaLabel: ad.ctaLabel,
    targetType,
    targetId: ad.id,
    sponsored: true,
  };
}

/**
 * Filters and orders sponsored inventory shared by local demo placements.
 * Missing `active` preserves legacy eligibility; malformed schedule/radius
 * values are rejected instead of silently treating the campaign as valid.
 */
export function selectEligibleSponsored(
  placements: readonly SponsoredPlacement[],
  options: SponsoredSelectionOptions = {},
): SponsoredPlacement[] {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return [];

  const seen = new Set<string>();
  return placements
    .map((placement, index) => ({ placement, index }))
    .filter(({ placement }) => {
      if (placement.sponsored !== true || placement.active === false) return false;
      if (seen.has(placement.id)) return false;

      for (const [field, value] of [["startsAt", placement.startsAt], ["endsAt", placement.endsAt]] as const) {
        if (value === undefined) continue;
        if (typeof value !== "string" || !value.trim()) return false;
        const timestamp = Date.parse(value);
        if (!Number.isFinite(timestamp)) return false;
        if (field === "startsAt" && nowMs < timestamp) return false;
        if (field === "endsAt" && nowMs > timestamp) return false;
      }

      if (placement.geoRadiusMeters !== undefined) {
        if (!Number.isFinite(placement.geoRadiusMeters) || placement.geoRadiusMeters < 0) return false;
        if (options.locationAvailable === true) {
          if (!Number.isFinite(placement.distanceMeters) || placement.distanceMeters < 0) return false;
          if (placement.distanceMeters > placement.geoRadiusMeters) return false;
        }
      }

      seen.add(placement.id);
      return true;
    })
    .sort((a, b) => {
      const distanceA = Number.isFinite(a.placement.distanceMeters) ? a.placement.distanceMeters : Number.POSITIVE_INFINITY;
      const distanceB = Number.isFinite(b.placement.distanceMeters) ? b.placement.distanceMeters : Number.POSITIVE_INFINITY;
      return distanceA - distanceB || a.index - b.index;
    })
    .map(({ placement }) => placement);
}

/**
 * Intercala orgânicos e patrocinados segundo um padrão explícito.
 * Se um lado acabar, o restante do outro é anexado — nunca inventa card.
 */
export function interleavePlacements(
  organic: readonly OrganicPlacement[],
  sponsored: readonly SponsoredPlacement[],
  pattern: readonly PlacementSlot[] = DEFAULT_PLACEMENT_PATTERN,
): DiscoveryPlacement[] {
  const organicQueue = organic.filter((item) => item.sponsored === false);
  const sponsoredQueue = selectEligibleSponsored(sponsored);
  const slots = pattern.length > 0 ? pattern : DEFAULT_PLACEMENT_PATTERN;
  const out: DiscoveryPlacement[] = [];
  let index = 0;

  while (organicQueue.length > 0 || sponsoredQueue.length > 0) {
    const slot = slots[index % slots.length];
    index += 1;
    if (slot === "sponsored" && sponsoredQueue.length > 0) {
      out.push(sponsoredQueue.shift()!);
      continue;
    }
    if (slot === "organic" && organicQueue.length > 0) {
      out.push(organicQueue.shift()!);
      continue;
    }
    if (sponsoredQueue.length > 0) {
      out.push(sponsoredQueue.shift()!);
      continue;
    }
    if (organicQueue.length > 0) {
      out.push(organicQueue.shift()!);
      continue;
    }
    break;
  }

  return out;
}
