import type { Recommendation } from "@/lib/engine/engine-types";
import { RecommendationType } from "@/lib/engine/engine-types";
import { mockRecommendations } from "@/lib/engine/engine-mocks";
import type { Person, Place } from "@/lib/mock-data";
import type {
  Business,
  BusinessEvent,
  BusinessRating,
  BusinessCategoryValue,
  PriceRangeValue,
} from "@/lib/marketplace/business-types";
import { BusinessCategory, PriceRange, EventStatus } from "@/lib/marketplace/business-types";

/* ─── Helpers ───────────────────────────────────────────── */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_MAP: Record<string, BusinessCategoryValue> = {
  cafe: BusinessCategory.CAFE,
  cafeteria: BusinessCategory.CAFE,
  restaurante: BusinessCategory.RESTAURANT,
  restaurantes: BusinessCategory.RESTAURANT,
  bar: BusinessCategory.BAR,
  bares: BusinessCategory.BAR,
  academia: BusinessCategory.GYM,
  academias: BusinessCategory.GYM,
  fitness: BusinessCategory.GYM,
  hotel: BusinessCategory.HOTEL,
  loja: BusinessCategory.STORE,
  lojas: BusinessCategory.STORE,
  saude: BusinessCategory.HEALTH,
  "bem-estar": BusinessCategory.HEALTH,
  servico: BusinessCategory.SERVICE,
  coworking: BusinessCategory.SERVICE,
  cinema: BusinessCategory.ENTERTAINMENT,
  museu: BusinessCategory.ENTERTAINMENT,
  parque: BusinessCategory.ENTERTAINMENT,
  entretenimento: BusinessCategory.ENTERTAINMENT,
};

export function mapCategory(category: string | null | undefined): BusinessCategoryValue {
  const key = (category ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return CATEGORY_MAP[key] ?? BusinessCategory.ENTERTAINMENT;
}

const PRICE_MAP: Record<string, PriceRangeValue> = {
  $: PriceRange.BUDGET,
  $$: PriceRange.MODERATE,
  $$$: PriceRange.EXPENSIVE,
  $$$$: PriceRange.PREMIUM,
};

export function mapPriceRange(price?: string | null): PriceRangeValue {
  const key = (price ?? "").trim();
  return PRICE_MAP[key] ?? PriceRange.MODERATE;
}

function ratingFrom(rec: Recommendation): BusinessRating {
  const average = rec.metadata.kind === "business" ? rec.metadata.rating : 4.5;
  const totalReviews = rec.metadata.kind === "business" ? rec.metadata.reviewCount : 1;
  const five = Math.round(totalReviews * (average / 5));
  const one = Math.max(0, totalReviews - five);
  return {
    average,
    totalReviews,
    distribution: { 5: five, 4: 0, 3: 0, 2: 0, 1: one },
  };
}

/* ─── Adapters ──────────────────────────────────────────── */

export function enginePersonById(id: string): Person | undefined {
  const rec = mockRecommendations.find((r) => r.type === RecommendationType.PERSON && r.id === id);
  if (!rec || rec.metadata.kind !== "person") return undefined;
  const meta = rec.metadata;
  return {
    id: rec.id,
    name: rec.title,
    age: meta.age,
    distanceMeters: rec.distanceMeters,
    online: meta.isOnline,
    lastSeen: meta.lastSeen ?? undefined,
    photo: rec.imageUrl,
    interests: [],
    bio: meta.profession ?? undefined,
    headline: meta.profession ?? undefined,
    vibeTags: [],
    favoritePlaceIds: [],
    looksFor: [],
    stats: {
      connections: meta.mutualConnections,
      meetups: 0,
      joinedAt: "2026",
    },
  };
}

export function engineEventById(id: string): BusinessEvent | undefined {
  const rec = mockRecommendations.find((r) => r.type === RecommendationType.EVENT && r.id === id);
  if (!rec || rec.metadata.kind !== "event") return undefined;
  const meta = rec.metadata;
  const startDate = new Date(meta.date);
  return {
    id: rec.id,
    businessId: "",
    title: rec.title,
    description: rec.subtitle,
    photo: rec.imageUrl,
    startDate,
    endDate: new Date(startDate.getTime() + 3 * 60 * 60 * 1000),
    location: meta.location,
    status: EventStatus.UPCOMING,
    attendeesCount: meta.attendingCount,
    isFeatured: rec.trending,
  };
}

export function engineBusinessById(id: string): Business | undefined {
  const rec = mockRecommendations.find(
    (r) => r.type === RecommendationType.BUSINESS && r.id === id,
  );
  if (!rec || rec.metadata.kind !== "business") return undefined;
  const meta = rec.metadata;
  return {
    id: rec.id,
    name: rec.title,
    slug: slugify(rec.title),
    description: rec.subtitle,
    category: mapCategory(meta.category),
    photos: [{ id: `${rec.id}-photo-1`, url: rec.imageUrl, alt: rec.title, isPrimary: true }],
    location: { lat: -23.5505, lng: -46.6333 },
    address: "São Paulo, SP",
    rating: ratingFrom(rec),
    priceRange: mapPriceRange(meta.priceRange),
    distanceMeters: rec.distanceMeters,
    isFavorite: false,
    isFollowing: meta.isFollowing,
    isOpen: true,
    hours: [],
    tags: [meta.category],
    promotions: [],
    events: [],
    couponCount: meta.offerCount,
    createdAt: new Date(),
  };
}

export function enginePlaceById(id: string): Place | undefined {
  const rec = mockRecommendations.find((r) => r.type === RecommendationType.PLACE && r.id === id);
  if (!rec || rec.metadata.kind !== "place") return undefined;
  const meta = rec.metadata;
  return {
    id: rec.id,
    name: rec.title,
    category: meta.category,
    distanceMeters: rec.distanceMeters,
    rating: meta.rating,
    reviews: meta.checkInCount,
    hours: meta.isOpen ? "Aberto agora" : "Fechado no momento",
    cover: rec.imageUrl,
    description: rec.subtitle,
    lat: -23.5505,
    lng: -46.6333,
    address: "São Paulo, SP",
  };
}

export function allEngineEvents(): BusinessEvent[] {
  return mockRecommendations
    .filter((r) => r.type === RecommendationType.EVENT)
    .map((rec) => engineEventById(rec.id))
    .filter((e): e is BusinessEvent => e !== undefined);
}
