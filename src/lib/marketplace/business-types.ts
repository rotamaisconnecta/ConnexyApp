/* =========================================================
   business-types.ts — Marketplace business type definitions
   Pure TypeScript. No React. No side effects.
========================================================= */

/* ─── BusinessCategory ──────────────────────────────────── */

export const BusinessCategory = {
  RESTAURANT: "RESTAURANT",
  BAR: "BAR",
  CAFE: "CAFE",
  HOTEL: "HOTEL",
  GYM: "GYM",
  EVENTS: "EVENTS",
  STORE: "STORE",
  HEALTH: "HEALTH",
  SERVICE: "SERVICE",
  ENTERTAINMENT: "ENTERTAINMENT",
} as const;

export type BusinessCategoryValue = (typeof BusinessCategory)[keyof typeof BusinessCategory];

/* ─── PriceRange ────────────────────────────────────────── */

export const PriceRange = {
  BUDGET: "BUDGET",
  MODERATE: "MODERATE",
  EXPENSIVE: "EXPENSIVE",
  PREMIUM: "PREMIUM",
} as const;

export type PriceRangeValue = (typeof PriceRange)[keyof typeof PriceRange];

/* ─── SortOption ────────────────────────────────────────── */

export const SortOption = {
  NEAREST: "NEAREST",
  BEST_RATED: "BEST_RATED",
  MOST_POPULAR: "MOST_POPULAR",
  PROMOTIONS: "PROMOTIONS",
  OPEN_NOW: "OPEN_NOW",
} as const;

export type SortOptionValue = (typeof SortOption)[keyof typeof SortOption];

/* ─── DiscountType ──────────────────────────────────────── */

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
  BOGO: "BOGO",
} as const;

export type DiscountTypeValue = (typeof DiscountType)[keyof typeof DiscountType];

/* ─── EventStatus ───────────────────────────────────────── */

export const EventStatus = {
  UPCOMING: "UPCOMING",
  ONGOING: "ONGOING",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
} as const;

export type EventStatusValue = (typeof EventStatus)[keyof typeof EventStatus];

/* ─── DayOfWeek ─────────────────────────────────────────── */

export const DayOfWeek = {
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT",
  SUN: "SUN",
} as const;

export type DayOfWeekValue = (typeof DayOfWeek)[keyof typeof DayOfWeek];

/* ─── GeoLocation ───────────────────────────────────────── */

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

/* ─── BusinessPhoto ─────────────────────────────────────── */

export interface BusinessPhoto {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

/* ─── BusinessHoursSlot ─────────────────────────────────── */

export interface BusinessHoursSlot {
  day: DayOfWeekValue;
  open: string;
  close: string;
  closed?: boolean;
}

/* ─── BusinessRating ────────────────────────────────────── */

export interface BusinessRating {
  average: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/* ─── Business ──────────────────────────────────────────── */

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: BusinessCategoryValue;
  subcategory?: string;
  photos: BusinessPhoto[];
  location: GeoLocation;
  address: string;
  phone?: string;
  website?: string;
  rating: BusinessRating;
  priceRange: PriceRangeValue;
  distanceMeters: number;
  isFavorite: boolean;
  isFollowing: boolean;
  isOpen: boolean;
  opensAt?: string;
  hours: BusinessHoursSlot[];
  tags: string[];
  promotions: Promotion[];
  events: BusinessEvent[];
  couponCount: number;
  popularTimes?: PopularTime[];
  createdAt: Date;
}

/* ─── Promotion ─────────────────────────────────────────── */

export interface Promotion {
  id: string;
  businessId: string;
  title: string;
  description: string;
  discountType: DiscountTypeValue;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  couponCode?: string;
}

/* ─── Coupon ────────────────────────────────────────────── */

export interface Coupon {
  id: string;
  businessId: string;
  code: string;
  label: string;
  description: string;
  discountType: DiscountTypeValue;
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
}

/* ─── BusinessEvent ─────────────────────────────────────── */

export interface BusinessEvent {
  id: string;
  businessId: string;
  title: string;
  description: string;
  photo?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: EventStatusValue;
  price?: number;
  capacity?: number;
  attendeesCount: number;
  isFeatured: boolean;
}

/* ─── PopularTime ───────────────────────────────────────── */

export interface PopularTime {
  day: DayOfWeekValue;
  hour: number;
  level: 0 | 1 | 2 | 3 | 4 | 5;
}

/* ─── MarketplaceFilters ────────────────────────────────── */

export interface MarketplaceFilters {
  categories: BusinessCategoryValue[];
  priceRange: PriceRangeValue[];
  minRating: number;
  isOpen: boolean;
  hasPromotions: boolean;
  hasEvents: boolean;
  maxDistance: number;
  searchQuery: string;
  sortBy: SortOptionValue;
}

/* ─── BusinessCategoryOptions ───────────────────────────── */

export const BUSINESS_CATEGORY_OPTIONS: {
  value: BusinessCategoryValue;
  label: string;
  icon: string;
}[] = [
  { value: BusinessCategory.RESTAURANT, label: "Restaurantes", icon: "🍽️" },
  { value: BusinessCategory.BAR, label: "Bares", icon: "🍺" },
  { value: BusinessCategory.CAFE, label: "Cafés", icon: "☕" },
  { value: BusinessCategory.HOTEL, label: "Hotéis", icon: "🏨" },
  { value: BusinessCategory.GYM, label: "Academias", icon: "💪" },
  { value: BusinessCategory.EVENTS, label: "Eventos", icon: "🎭" },
  { value: BusinessCategory.STORE, label: "Lojas", icon: "🛍️" },
  { value: BusinessCategory.HEALTH, label: "Saúde", icon: "🏥" },
  { value: BusinessCategory.SERVICE, label: "Serviços", icon: "🔧" },
  { value: BusinessCategory.ENTERTAINMENT, label: "Entretenimento", icon: "🎬" },
];

/* ─── SortOptions ───────────────────────────────────────── */

export const SORT_OPTIONS: {
  value: SortOptionValue;
  label: string;
}[] = [
  { value: SortOption.NEAREST, label: "Mais próximos" },
  { value: SortOption.BEST_RATED, label: "Melhor avaliados" },
  { value: SortOption.MOST_POPULAR, label: "Mais populares" },
  { value: SortOption.PROMOTIONS, label: "Promoções" },
  { value: SortOption.OPEN_NOW, label: "Abertos agora" },
];

/* ─── PriceRangeOptions ─────────────────────────────────── */

export const PRICE_RANGE_OPTIONS: {
  value: PriceRangeValue;
  label: string;
  symbol: string;
}[] = [
  { value: PriceRange.BUDGET, label: "Econômico", symbol: "$" },
  { value: PriceRange.MODERATE, label: "Moderado", symbol: "$$" },
  { value: PriceRange.EXPENSIVE, label: "Caro", symbol: "$$$" },
  { value: PriceRange.PREMIUM, label: "Premium", symbol: "$$$$" },
];
