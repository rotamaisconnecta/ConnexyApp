/* ==== integration-marketplace.ts -- Marketplace integration layer
   Pure TypeScript. No React. No side effects. ==== */

import type {
  IntegrationEvent,
  IntegrationPayload,
  EngineOfferInput,
  EngineBusinessInput,
  HeatLevelValue,
  MarketplaceBusinessData,
  MarketplaceOfferData,
} from "./integration-types";
import { IntegrationAction, HeatLevel } from "./integration-types";
import {
  generateIntegrationId,
  haversineDistance,
  isWithinTimeWindow,
  formatDiscount,
} from "./integration-utils";

/* ==== Create offer integration event ==== */

export function createOfferIntegrationEvent(
  offerId: string,
  businessId: string,
  businessName: string,
  title: string,
  discountPercent: number,
  lat: number,
  lng: number,
): IntegrationEvent {
  return {
    id: generateIntegrationId("mkt"),
    action: IntegrationAction.OFFER_CREATED,
    sourceTarget: "MARKETPLACE",
    targets: ["FEED", "MAP", "NOTIFICATIONS", "ENGINE"],
    timestamp: new Date().toISOString(),
    payload: {
      kind: "offer",
      offerId,
      businessId,
      businessName,
      title,
      discountPercent,
      lat,
      lng,
    },
    processed: false,
  };
}

/* ==== Data transformation for engine ==== */

export function toEngineOfferInput(data: MarketplaceOfferData): EngineOfferInput {
  return {
    id: data.offerId,
    businessId: data.businessId,
    title: data.title,
    discountPercent: data.discountPercent,
    lat: data.lat,
    lng: data.lng,
    validUntil: data.validUntil,
  };
}

export function toEngineBusinessInput(data: MarketplaceBusinessData): EngineBusinessInput {
  return {
    id: data.businessId,
    name: data.businessName,
    category: data.category,
    lat: data.lat,
    lng: data.lng,
    rating: data.rating,
    isOpen: data.isOpen,
  };
}

/* ==== Offer scoring ==== */

export function scoreOfferForRecommendation(
  offer: MarketplaceOfferData,
  userLat: number,
  userLng: number,
  userInterests: string[],
  now: Date = new Date(),
): number {
  let score = 0;

  const distance = haversineDistance(userLat, userLng, offer.lat, offer.lng);
  if (distance < 500) score += 25;
  else if (distance < 1000) score += 15;
  else if (distance < 3000) score += 5;

  score += Math.min(offer.discountPercent / 2, 25);

  if (isWithinTimeWindow(offer.validUntil, 86400000)) score += 15;

  if (new Date(offer.validUntil).getTime() > now.getTime()) score += 10;

  if (!offer.isClaimed) score += 5;

  return Math.min(score, 100);
}

/* ==== Business scoring ==== */

export function scoreBusinessForRecommendation(
  business: MarketplaceBusinessData,
  userLat: number,
  userLng: number,
  userInterests: string[],
  now: Date = new Date(),
): number {
  let score = 0;

  const distance = haversineDistance(userLat, userLng, business.lat, business.lng);
  if (distance < 500) score += 25;
  else if (distance < 1000) score += 18;
  else if (distance < 3000) score += 10;

  score += Math.min(business.rating * 5, 25);

  if (business.isOpen) score += 15;

  if (business.promotionCount > 0) score += 10;
  if (business.couponCount > 0) score += 5;
  if (business.isFollowing) score += 5;

  return Math.min(score, 100);
}

/* ==== Marketplace heatmap data ==== */

export function computeMarketplaceHeatLevel(
  activeOffers: number,
  recentCheckins: number,
): HeatLevelValue {
  const activity = activeOffers * 3 + recentCheckins;
  if (activity >= 20) return HeatLevel.BURNING;
  if (activity >= 10) return HeatLevel.HOT;
  if (activity >= 3) return HeatLevel.WARM;
  return HeatLevel.COLD;
}

/* ==== Marketplace notification generation ==== */

export function generateMarketplaceNotification(
  offer: MarketplaceOfferData,
  userLat: number,
  userLng: number,
): { title: string; body: string; priority: "LOW" | "MEDIUM" | "HIGH" } | null {
  const distance = haversineDistance(userLat, userLng, offer.lat, offer.lng);
  if (distance > 5000) return null;

  if (isWithinTimeWindow(offer.validUntil, 3600000)) {
    return {
      title: `⏰ ${offer.title}`,
      body: `${formatDiscount(offer.discountPercent)} em ${offer.businessName} • expira em breve!`,
      priority: "HIGH",
    };
  }

  if (offer.discountPercent >= 30) {
    return {
      title: `🏷️ ${offer.title}`,
      body: `${formatDiscount(offer.discountPercent)} em ${offer.businessName}`,
      priority: "MEDIUM",
    };
  }

  return {
    title: `🏷️ ${offer.title}`,
    body: `${formatDiscount(offer.discountPercent)} em ${offer.businessName}`,
    priority: "LOW",
  };
}

/* ==== Marketplace map marker data ==== */

export function createBusinessMarkerData(
  business: MarketplaceBusinessData,
  userLat: number,
  userLng: number,
): {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  distanceMeters: number;
  isOpen: boolean;
  rating: number;
  promotionCount: number;
} {
  return {
    id: business.businessId,
    lat: business.lat,
    lng: business.lng,
    title: business.businessName,
    subtitle: `${business.category} • ${business.rating.toFixed(1)}⭐`,
    distanceMeters: haversineDistance(userLat, userLng, business.lat, business.lng),
    isOpen: business.isOpen,
    rating: business.rating,
    promotionCount: business.promotionCount,
  };
}

export function createOfferMarkerData(
  offer: MarketplaceOfferData,
  userLat: number,
  userLng: number,
): {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  distanceMeters: number;
  discountPercent: number;
  validUntil: string;
} {
  return {
    id: offer.offerId,
    lat: offer.lat,
    lng: offer.lng,
    title: offer.title,
    subtitle: `${offer.businessName} • ${formatDiscount(offer.discountPercent)}`,
    distanceMeters: haversineDistance(userLat, userLng, offer.lat, offer.lng),
    discountPercent: offer.discountPercent,
    validUntil: offer.validUntil,
  };
}

/* ==== Marketplace feed text generation ==== */

export function generateMarketplaceFeedText(
  event: IntegrationEvent,
): { text: string; emoji: string } | null {
  if (event.action === IntegrationAction.OFFER_CREATED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "offer" }>;
    return {
      text: `Nova oferta: ${p.title} (${formatDiscount(p.discountPercent)}) em ${p.businessName}`,
      emoji: "🏷️",
    };
  }

  if (event.action === IntegrationAction.BUSINESS_UPDATED) {
    const p = event.payload as Extract<IntegrationPayload, { kind: "business" }>;
    return {
      text: `${p.businessName} atualizou suas informações`,
      emoji: "🏪",
    };
  }

  return null;
}

/* ==== Marketplace aggregation ==== */

export function aggregateOffersByBusiness(
  offers: MarketplaceOfferData[],
): Map<string, { businessName: string; offers: MarketplaceOfferData[]; totalDiscount: number }> {
  const map = new Map<
    string,
    { businessName: string; offers: MarketplaceOfferData[]; totalDiscount: number }
  >();

  for (const offer of offers) {
    const existing = map.get(offer.businessId) ?? {
      businessName: offer.businessName,
      offers: [],
      totalDiscount: 0,
    };
    existing.offers.push(offer);
    existing.totalDiscount += offer.discountPercent;
    map.set(offer.businessId, existing);
  }

  return map;
}

/* ==== Marketplace engine input generation ==== */

export function generateMarketplaceEngineInputs(
  businesses: MarketplaceBusinessData[],
  offers: MarketplaceOfferData[],
): {
  businesses: EngineBusinessInput[];
  offers: EngineOfferInput[];
} {
  return {
    businesses: businesses.map(toEngineBusinessInput),
    offers: offers.map(toEngineOfferInput),
  };
}

/* ==== Marketplace filtering helpers ==== */

export function filterActiveOffers(
  offers: MarketplaceOfferData[],
  now: Date = new Date(),
): MarketplaceOfferData[] {
  return offers.filter((o) => {
    const validUntil = new Date(o.validUntil).getTime();
    return validUntil > now.getTime();
  });
}

export function filterOpenBusinesses(
  businesses: MarketplaceBusinessData[],
): MarketplaceBusinessData[] {
  return businesses.filter((b) => b.isOpen);
}

export function filterBusinessesWithPromotions(
  businesses: MarketplaceBusinessData[],
): MarketplaceBusinessData[] {
  return businesses.filter((b) => b.promotionCount > 0);
}

export function filterBusinessesWithCoupons(
  businesses: MarketplaceBusinessData[],
): MarketplaceBusinessData[] {
  return businesses.filter((b) => b.couponCount > 0);
}

/* ==== Marketplace nearby computation ==== */

export function getNearbyBusinesses(
  businesses: MarketplaceBusinessData[],
  userLat: number,
  userLng: number,
  maxDistanceMeters = 3000,
): (MarketplaceBusinessData & { distanceMeters: number })[] {
  return businesses
    .map((b) => ({
      ...b,
      distanceMeters: haversineDistance(userLat, userLng, b.lat, b.lng),
    }))
    .filter((b) => b.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function getNearbyOffers(
  offers: MarketplaceOfferData[],
  userLat: number,
  userLng: number,
  maxDistanceMeters = 3000,
): (MarketplaceOfferData & { distanceMeters: number })[] {
  return offers
    .map((o) => ({
      ...o,
      distanceMeters: haversineDistance(userLat, userLng, o.lat, o.lng),
    }))
    .filter((o) => o.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
