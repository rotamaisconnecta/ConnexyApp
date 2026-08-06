/* =========================================================
   mock-businesses.ts — Mock data shared by Marketplace and
   the business/event detail pages.
   Pure TypeScript. No React. No side effects.
   Source of truth for business ids (b1..b6), events (evt-*)
   and coupons. Both routes import from here so a click in
   the list resolves to the same entity in the detail page.
========================================================= */

import type {
  Business,
  BusinessPhoto,
  BusinessRating,
  BusinessHoursSlot,
  Promotion,
  BusinessEvent,
  Coupon,
} from "./business-types";
import {
  BusinessCategory,
  PriceRange,
  DayOfWeek,
  EventStatus,
  DiscountType,
} from "./business-types";

/* ─── Mock helpers ─────────────────────────────────────── */

export function createMockPhotos(count: number, businessName: string): BusinessPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${businessName.toLowerCase().replace(/\s/g, "-")}-${i}`,
    url: `https://picsum.photos/seed/${businessName.toLowerCase().replace(/\s/g, "-")}${i}/400/300`,
    alt: `${businessName} foto ${i + 1}`,
    isPrimary: i === 0,
  }));
}

export function createMockRating(avg: number, total: number): BusinessRating {
  return {
    average: avg,
    totalReviews: total,
    distribution: {
      1: Math.round(total * 0.02),
      2: Math.round(total * 0.05),
      3: Math.round(total * 0.15),
      4: Math.round(total * 0.35),
      5: Math.round(total * 0.43),
    },
  };
}

export function createMockHours(): BusinessHoursSlot[] {
  return [
    { day: DayOfWeek.MON, open: "08:00", close: "22:00" },
    { day: DayOfWeek.TUE, open: "08:00", close: "22:00" },
    { day: DayOfWeek.WED, open: "08:00", close: "22:00" },
    { day: DayOfWeek.THU, open: "08:00", close: "22:00" },
    { day: DayOfWeek.FRI, open: "08:00", close: "23:00" },
    { day: DayOfWeek.SAT, open: "10:00", close: "23:00" },
    { day: DayOfWeek.SUN, open: "10:00", close: "20:00" },
  ];
}

/* ─── Promotions ───────────────────────────────────────── */

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: "promo-1",
    businessId: "b1",
    title: "Happy Hour",
    description: "20% em todas as bebidas das 17h às 20h",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    validFrom: new Date("2026-07-01"),
    validUntil: new Date("2026-12-31"),
    isActive: true,
  },
  {
    id: "promo-2",
    businessId: "b2",
    title: "Almoço executivo",
    description: "R$10 OFF em pratos acima de R$40",
    discountType: DiscountType.FIXED,
    discountValue: 10,
    minPurchase: 40,
    validFrom: new Date("2026-07-01"),
    validUntil: new Date("2026-09-30"),
    isActive: true,
    couponCode: "ALMOCO10",
  },
  {
    id: "promo-3",
    businessId: "b3",
    title: "Combo café",
    description: "Leve 1 café pague 1 em combo da manhã",
    discountType: DiscountType.BOGO,
    discountValue: 2,
    validFrom: new Date("2026-07-01"),
    validUntil: new Date("2026-08-31"),
    isActive: true,
  },
];

/* ─── Events ───────────────────────────────────────────── */

export const MOCK_EVENTS: BusinessEvent[] = [
  {
    id: "evt-1",
    businessId: "b1",
    title: "Noite de Jazz",
    description: "Apresentação ao vivo com quarteto de jazz",
    photo: "https://picsum.photos/seed/jazz-night/400/200",
    startDate: new Date("2026-07-25T20:00:00"),
    endDate: new Date("2026-07-25T23:00:00"),
    location: "Salão principal",
    status: EventStatus.UPCOMING,
    price: 35,
    capacity: 80,
    attendeesCount: 42,
    isFeatured: true,
  },
  {
    id: "evt-2",
    businessId: "b1",
    title: "Degustação de Vinhos",
    description: "Degustação guiada dos melhores vinhos importados",
    startDate: new Date("2026-08-05T19:00:00"),
    endDate: new Date("2026-08-05T21:30:00"),
    status: EventStatus.UPCOMING,
    price: 89,
    capacity: 30,
    attendeesCount: 18,
    isFeatured: false,
  },
];

/* ─── Businesses ───────────────────────────────────────── */

export const MOCK_BUSINESSES: Business[] = [
  {
    id: "b1",
    name: "Bistrô Paulista",
    slug: "bistro-paulista",
    description: "Gastronomia contemporânea com ingredientes frescos e ambiente aconchegante",
    category: BusinessCategory.RESTAURANT,
    subcategory: "Restaurante francês",
    photos: createMockPhotos(5, "Bistrô Paulista"),
    location: { lat: -23.555, lng: -46.655, label: "Av. Paulista, 1500" },
    address: "Av. Paulista, 1500 - São Paulo, SP",
    phone: "+5511999990001",
    website: "https://bistropaulista.com.br",
    rating: createMockRating(4.7, 320),
    priceRange: PriceRange.EXPENSIVE,
    distanceMeters: 850,
    isFavorite: true,
    isFollowing: false,
    isOpen: true,
    hours: createMockHours(),
    tags: ["francês", "romântico", "especial"],
    promotions: [MOCK_PROMOTIONS[0]],
    events: MOCK_EVENTS,
    couponCount: 2,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "b2",
    name: "Café Aroma",
    slug: "cafe-aroma",
    description: "Café artesanal com grãos selecionados e doces caseiros",
    category: BusinessCategory.CAFE,
    photos: createMockPhotos(3, "Café Aroma"),
    location: { lat: -23.55, lng: -46.64, label: "Rua Augusta, 900" },
    address: "Rua Augusta, 900 - São Paulo, SP",
    rating: createMockRating(4.8, 210),
    priceRange: PriceRange.MODERATE,
    distanceMeters: 420,
    isFavorite: false,
    isFollowing: true,
    isOpen: true,
    hours: createMockHours(),
    tags: ["café", "doces", "wi-fi"],
    promotions: [MOCK_PROMOTIONS[2]],
    events: [],
    couponCount: 1,
    createdAt: new Date("2024-03-20"),
  },
  {
    id: "b3",
    name: "Bar Refrão",
    slug: "bar-refrao",
    description: "O melhor happy hour da cidade com petiscos e cervejas artesanais",
    category: BusinessCategory.BAR,
    photos: createMockPhotos(4, "Bar Refrão"),
    location: { lat: -23.548, lng: -46.66, label: "Rua Oscar Freire, 400" },
    address: "Rua Oscar Freire, 400 - São Paulo, SP",
    phone: "+5511999990003",
    rating: createMockRating(4.5, 180),
    priceRange: PriceRange.MODERATE,
    distanceMeters: 1200,
    isFavorite: false,
    isFollowing: false,
    isOpen: true,
    hours: createMockHours(),
    tags: ["bar", "happy hour", "petiscos"],
    promotions: [MOCK_PROMOTIONS[1]],
    events: [MOCK_EVENTS[0]],
    couponCount: 3,
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "b4",
    name: "Studio Fit",
    slug: "studio-fit",
    description: "Academia moderna com equipamentos de última geração e personal trainer",
    category: BusinessCategory.GYM,
    photos: createMockPhotos(2, "Studio Fit"),
    location: { lat: -23.558, lng: -46.645, label: "Rua Haddock Lobo, 700" },
    address: "Rua Haddock Lobo, 700 - São Paulo, SP",
    rating: createMockRating(4.6, 150),
    priceRange: PriceRange.MODERATE,
    distanceMeters: 1800,
    isFavorite: false,
    isFollowing: false,
    isOpen: true,
    hours: createMockHours(),
    tags: ["academia", "musculação", "personal"],
    promotions: [],
    events: [],
    couponCount: 0,
    createdAt: new Date("2024-05-01"),
  },
  {
    id: "b5",
    name: "Loja Estilo",
    slug: "loja-estilo",
    description: "Moda e acessórios com as últimas tendências nacionais e internacionais",
    category: BusinessCategory.STORE,
    photos: createMockPhotos(3, "Loja Estilo"),
    location: { lat: -23.553, lng: -46.652, label: "Shopping Center 3" },
    address: "Shopping Center 3, Loja 205 - São Paulo, SP",
    rating: createMockRating(4.3, 95),
    priceRange: PriceRange.EXPENSIVE,
    distanceMeters: 2500,
    isFavorite: true,
    isFollowing: true,
    isOpen: false,
    opensAt: "10:00",
    hours: createMockHours(),
    tags: ["moda", "acessórios", "premium"],
    promotions: [],
    events: [],
    couponCount: 1,
    createdAt: new Date("2024-04-15"),
  },
  {
    id: "b6",
    name: "Hotel Luxe",
    slug: "hotel-luxe",
    description: "Hotel boutique com spa, piscina e restaurante premiado",
    category: BusinessCategory.HOTEL,
    photos: createMockPhotos(4, "Hotel Luxe"),
    location: { lat: -23.56, lng: -46.65, label: "Av. Brigadeiro Faria Lima, 2000" },
    address: "Av. Brigadeiro Faria Lima, 2000 - São Paulo, SP",
    phone: "+5511999990006",
    rating: createMockRating(4.9, 410),
    priceRange: PriceRange.PREMIUM,
    distanceMeters: 3200,
    isFavorite: false,
    isFollowing: false,
    isOpen: true,
    hours: createMockHours(),
    tags: ["hotel", "spa", "luxo"],
    promotions: [],
    events: [MOCK_EVENTS[1]],
    couponCount: 0,
    createdAt: new Date("2023-12-01"),
  },
];

/* ─── Coupons ──────────────────────────────────────────── */

export const MOCK_COUPONS: Coupon[] = [
  {
    id: "c1",
    businessId: "b1",
    code: "BISTRO20",
    label: "BISTRO20",
    description: "20% OFF no pedido acima de R$100",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    maxDiscount: 40,
    minPurchase: 100,
    validFrom: new Date("2026-07-01"),
    validUntil: new Date("2026-12-31"),
    isActive: true,
    usageCount: 15,
  },
  {
    id: "c2",
    businessId: "b1",
    code: "JANTA25",
    label: "JANTA25",
    description: "R$25 OFF no menu executivo",
    discountType: DiscountType.FIXED,
    discountValue: 25,
    minPurchase: 80,
    validFrom: new Date("2026-07-01"),
    validUntil: new Date("2026-10-31"),
    isActive: true,
    usageLimit: 50,
    usageCount: 32,
  },
  {
    id: "c3",
    businessId: "b1",
    code: "VINHO10",
    label: "VINHO10",
    description: "10% OFF em garrafas de vinho",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    validFrom: new Date("2026-07-01"),
    validUntil: new Date("2026-08-15"),
    isActive: true,
    usageCount: 8,
  },
];

/* ─── Lookups ──────────────────────────────────────────── */

export function getBusinessById(id: string): Business | undefined {
  return MOCK_BUSINESSES.find((b) => b.id === id);
}

export function getEventById(id: string): BusinessEvent | undefined {
  return MOCK_EVENTS.find((e) => e.id === id);
}
