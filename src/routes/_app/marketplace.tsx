import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BottomNav } from "@/components/bottom-nav";
import { SearchBar } from "@/components/marketplace/search-bar";
import { CategoryFilter } from "@/components/marketplace/category-filter";
import { MarketplaceFiltersPanel } from "@/components/marketplace/marketplace-filters";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { OfferCarousel } from "@/components/marketplace/offer-carousel";
import { LoadingMarketplace } from "@/components/marketplace/loading-marketplace";
import { EmptyMarketplace } from "@/components/marketplace/empty-marketplace";
import { ChevronLeft } from "lucide-react";
import { useState, useMemo } from "react";
import type {
  Business,
  BusinessCategoryValue,
  BusinessPhoto,
  BusinessRating,
  BusinessHoursSlot,
  Promotion,
  BusinessEvent,
  MarketplaceFilters,
} from "@/lib/marketplace/business-types";
import {
  BusinessCategory,
  PriceRange,
  SortOption,
  DayOfWeek,
  EventStatus,
  DiscountType,
} from "@/lib/marketplace/business-types";
import { filterBusinesses, DEFAULT_FILTERS } from "@/lib/marketplace/business-filter";
import { sortBusinesses } from "@/lib/marketplace/business-ranking";

export const Route = createFileRoute("/_app/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace" }] }),
  component: MarketplacePage,
});

function createMockPhotos(count: number, businessName: string): BusinessPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${businessName.toLowerCase().replace(/\s/g, "-")}-${i}`,
    url: `https://picsum.photos/seed/${businessName.toLowerCase().replace(/\s/g, "-")}${i}/400/300`,
    alt: `${businessName} foto ${i + 1}`,
    isPrimary: i === 0,
  }));
}

function createMockRating(avg: number, total: number): BusinessRating {
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

function createMockHours(): BusinessHoursSlot[] {
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

const MOCK_PROMOTIONS: Promotion[] = [
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

const MOCK_EVENTS: BusinessEvent[] = [
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

const MOCK_BUSINESSES: Business[] = [
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

function MarketplacePage() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MarketplaceFilters>({
    ...DEFAULT_FILTERS,
    sortBy: SortOption.NEAREST,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBusinesses = useMemo(() => {
    const result = filterBusinesses(MOCK_BUSINESSES, {
      ...filters,
      searchQuery: search,
    });
    return sortBusinesses(result, filters.sortBy);
  }, [filters, search]);

  const allPromotions = MOCK_BUSINESSES.flatMap((b) => b.promotions);

  function handleSelectBusiness(id: string) {
    nav({ to: "/business/$businessId", params: { businessId: id } });
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <Link to="/home" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-base">Marketplace</h1>
          <p className="text-[11px] text-muted-foreground">
            Descubra empresas e promoções perto de você
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 space-y-4 overflow-y-auto no-scrollbar">
        <SearchBar value={search} onChange={setSearch} businesses={MOCK_BUSINESSES} />

        <CategoryFilter
          selected={filters.categories}
          onSelect={(cats) => setFilters({ ...filters, categories: cats })}
        />

        <MarketplaceFiltersPanel filters={filters} onFiltersChange={setFilters} />

        {allPromotions.length > 0 && <OfferCarousel promotions={allPromotions} />}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredBusinesses.length} empresa{filteredBusinesses.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Grade
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-7 px-2 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {filteredBusinesses.length === 0 ? (
          <EmptyMarketplace message="Nenhuma empresa encontrada" />
        ) : viewMode === "grid" ? (
          <BusinessGrid businesses={filteredBusinesses} onSelect={handleSelectBusiness} />
        ) : (
          <div className="space-y-3">
            {filteredBusinesses.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBusiness(b.id)}
                className="w-full text-left rounded-2xl bg-surface border border-border/50 p-3 flex gap-3 shadow-soft transition-all active:scale-[0.98]"
              >
                {b.photos[0] && (
                  <img
                    src={b.photos[0].url}
                    alt={b.name}
                    className="h-20 w-20 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-semibold text-sm truncate">{b.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{b.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber font-medium">★ {b.rating.average}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {b.distanceMeters < 1000
                        ? `${b.distanceMeters}m`
                        : `${(b.distanceMeters / 1000).toFixed(1)}km`}
                    </span>
                    {b.isOpen ? (
                      <span className="text-[10px] text-success font-medium">Aberto</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Fechado</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
