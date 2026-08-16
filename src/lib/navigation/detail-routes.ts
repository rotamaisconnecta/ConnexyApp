import type { PremiumCard } from "@/lib/feed/home-premium";
import type { SponsoredContent } from "@/lib/ads/mock-sponsored-content";
import type { Recommendation, RecommendationMetadata } from "@/lib/engine/engine-types";
import { RecommendationType } from "@/lib/engine/engine-types";
import { getAllBusinesses } from "@/lib/marketplace/mock-businesses";
import { findPlace } from "@/lib/mock-data";

const DISCOVER_ROUTE = "/discover";

export function resolvePremiumCardRoute(card: PremiumCard): string | null {
  if (!card.route || card.route === DISCOVER_ROUTE) return null;
  return card.route;
}

export function resolveSponsoredRoute(ad: SponsoredContent): string | null {
  if (ad.action === "view-event") return `/event/${ad.id}`;
  return `/business/${ad.id}`;
}

function businessNameToRoute(name: string): string | null {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const business = getAllBusinesses().find(
    (b) => b.name.toLowerCase() === name.toLowerCase() || b.slug === slug,
  );
  if (business) return `/business/${business.id}`;
  const place = findPlace(slug);
  if (place) return `/local/${place.id}`;
  return null;
}

export function resolveRecommendationRoute(rec: Recommendation): string | null {
  switch (rec.type) {
    case RecommendationType.PERSON:
      return `/perfil/${rec.id}`;
    case RecommendationType.EVENT:
      return `/event/${rec.id}`;
    case RecommendationType.BUSINESS:
      return `/business/${rec.id}`;
    case RecommendationType.PLACE:
      return `/local/${rec.id}`;
    case RecommendationType.OFFER: {
      const meta = rec.metadata as RecommendationMetadata;
      if (meta.kind === "offer" && meta.businessName) {
        return businessNameToRoute(meta.businessName);
      }
      return null;
    }
    case RecommendationType.DRIVER:
      return "/ride";
    default:
      return null;
  }
}
