/* =========================================================
   post-ride-discovery.ts — Lugares perto do destino +
   inventário patrocinado para a tela de conclusão.
   O frontend só monta a lista; targeting fica no backend futuro.
   Pure TypeScript. No React. No side effects. No Supabase.
========================================================= */

import {
  interleavePlacements,
  selectEligibleSponsored,
  sponsoredContentToPlacement as convertSponsoredContent,
  type DiscoveryPlacement,
  type OrganicPlacement,
  type SponsoredPlacement,
} from "@/lib/ads/sponsored-placement";
import { SPONSORED_ADS, type SponsoredContent } from "@/lib/ads/mock-sponsored-content";
import { resolveSponsoredRoute } from "@/lib/navigation/detail-routes";
import { mergeCatalogPlaces } from "@/lib/catalog/local-catalog";
import { places } from "@/lib/mock-data";
import { calculateDistanceMeters } from "@/lib/marketplace/distance-utils";
import type { GeoLocation } from "@/lib/mobility/ride-types";

const ORGANIC_LIMIT = 6;
const SPONSORED_LIMIT = 2;
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800";
export const RATING_COMMENT_MAX = 300;

const STAR_FEEDBACK = ["", "Péssima", "Ruim", "Regular", "Boa", "Excelente!"] as const;

export function ratingFeedbackLabel(stars: number): string {
  if (stars < 1 || stars > 5) return "";
  return STAR_FEEDBACK[stars];
}

/** Pontos Connexy derivados da tarifa real da viagem (1 ponto ≈ R$ 1). */
export function connexyPointsForFare(fare: number): number {
  if (!Number.isFinite(fare) || fare <= 0) return 0;
  return Math.max(0, Math.round(fare));
}

export function formatPostRideDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function distanceFromDestination(
  destination: GeoLocation | null | undefined,
  lat: number | undefined,
  lng: number | undefined,
  fallbackMeters: number,
): number {
  if (
    destination &&
    Number.isFinite(destination.lat) &&
    Number.isFinite(destination.lng) &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return calculateDistanceMeters(
      { lat: destination.lat, lng: destination.lng },
      { lat: lat as number, lng: lng as number },
    );
  }
  return fallbackMeters;
}

export function sponsoredContentToPlacement(
  ad: SponsoredContent,
  destination?: GeoLocation | null,
): SponsoredPlacement {
  return convertSponsoredContent(
    ad,
    distanceFromDestination(destination, ad.latitude, ad.longitude, ad.distanceMeters),
  );
}

export function listPostRideOrganicPlaces(
  destination?: GeoLocation | null,
  limit = ORGANIC_LIMIT,
): OrganicPlacement[] {
  return mergeCatalogPlaces(places)
    .filter((place) => Boolean(place.cover))
    .map((place) => ({
      id: place.id,
      name: place.name,
      image: place.cover || FALLBACK_IMAGE,
      category: place.category,
      distanceMeters: distanceFromDestination(destination, place.lat, place.lng, place.distanceMeters),
      rating: place.rating,
      targetType: "place" as const,
      targetId: place.id,
      sponsored: false as const,
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

export function listPostRideSponsoredPlaces(
  destination?: GeoLocation | null,
  limit = SPONSORED_LIMIT,
): SponsoredPlacement[] {
  return selectEligibleSponsored(
    SPONSORED_ADS.map((ad) => sponsoredContentToPlacement(ad, destination)),
    { locationAvailable: hasValidLocation(destination) },
  )
    .slice(0, limit);
}

function hasValidLocation(location?: GeoLocation | null): boolean {
  return Boolean(
    location && Number.isFinite(location.lat) && Number.isFinite(location.lng),
  );
}

export function listPostRideDiscovery(
  destination?: GeoLocation | null,
): DiscoveryPlacement[] {
  return interleavePlacements(
    listPostRideOrganicPlaces(destination),
    listPostRideSponsoredPlaces(destination),
  );
}

export type PostRideNavigation =
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string };

export function resolvePostRideNavigation(card: DiscoveryPlacement): PostRideNavigation | null {
  if (card.targetType === "external") {
    return card.targetId ? { kind: "external", href: card.targetId } : null;
  }
  if (card.targetType === "internal") {
    return card.targetId ? { kind: "internal", href: card.targetId } : null;
  }
  if (card.sponsored) {
    const ad = SPONSORED_ADS.find((item) => item.id === card.targetId);
    const href = ad ? resolveSponsoredRoute(ad) : null;
    return href ? { kind: "internal", href } : null;
  }
  if (card.targetType === "place") return { kind: "internal", href: `/local/${card.targetId}` };
  if (card.targetType === "event") return { kind: "internal", href: `/event/${card.targetId}` };
  if (card.targetType === "business") {
    return { kind: "internal", href: `/business/${card.targetId}` };
  }
  return null;
}
