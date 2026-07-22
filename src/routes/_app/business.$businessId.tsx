import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BusinessHeader } from "@/components/marketplace/business-header";
import { BusinessDetails } from "@/components/marketplace/business-details";
import { CouponList } from "@/components/marketplace/coupon-list";
import { FollowBusinessButton } from "@/components/marketplace/follow-business-button";
import { ChevronLeft, Navigation, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import type {
  Business,
  BusinessPhoto,
  BusinessRating,
  BusinessHoursSlot,
  Promotion,
  BusinessEvent,
  Coupon,
} from "@/lib/marketplace/business-types";
import {
  BusinessCategory,
  PriceRange,
  DayOfWeek,
  EventStatus,
  DiscountType,
} from "@/lib/marketplace/business-types";

export const Route = createFileRoute("/_app/business/$businessId")({
  head: () => ({ meta: [{ title: "Empresa" }] }),
  component: BusinessDetailPage,
});

function createMockPhotos(count: number, name: string): BusinessPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${name.toLowerCase().replace(/\s/g, "-")}-${i}`,
    url: `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, "-")}${i}/400/300`,
    alt: `${name} foto ${i + 1}`,
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

const MOCK_BUSINESS: Business = {
  id: "b1",
  name: "Bistrô Paulista",
  slug: "bistro-paulista",
  description:
    "Gastronomia contemporânea com ingredientes frescos e ambiente aconchegante. Conhecido pelo risoto de cogumelos e pela carta de vinhos premiada.",
  category: BusinessCategory.RESTAURANT,
  subcategory: "Restaurante francês",
  photos: createMockPhotos(6, "Bistrô Paulista"),
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
  tags: ["francês", "romântico", "especial", "espaço privativo", "vinhos"],
  promotions: [
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
      id: "promo-4",
      businessId: "b1",
      title: "Janta executiva",
      description: "R$25 OFF no menu executivo de segunda a sexta",
      discountType: DiscountType.FIXED,
      discountValue: 25,
      minPurchase: 80,
      validFrom: new Date("2026-07-01"),
      validUntil: new Date("2026-10-31"),
      isActive: true,
      couponCode: "JANTA25",
    },
  ],
  events: [
    {
      id: "evt-1",
      businessId: "b1",
      title: "Noite de Jazz",
      description: "Apresentação ao vivo com quarteto de jazz. Espaço limitado.",
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
      description: "Degustação guiada dos melhores vinhos importados da Toscana.",
      startDate: new Date("2026-08-05T19:00:00"),
      endDate: new Date("2026-08-05T21:30:00"),
      status: EventStatus.UPCOMING,
      price: 89,
      capacity: 30,
      attendeesCount: 18,
      isFeatured: false,
    },
  ],
  couponCount: 3,
  createdAt: new Date("2024-01-15"),
};

const MOCK_COUPONS: Coupon[] = [
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

function BusinessDetailPage() {
  const params = Route.useParams();
  const nav = useNavigate();
  const [business, setBusiness] = useState<Business>(MOCK_BUSINESS);

  const filteredCoupons = useMemo(
    () => MOCK_COUPONS.filter((c) => c.businessId === params.businessId),
    [params.businessId],
  );

  function handleFavorite() {
    setBusiness((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
  }

  function handleFollow() {
    setBusiness((prev) => ({ ...prev, isFollowing: !prev.isFollowing }));
  }

  function handleShare() {}

  function handleSave() {}

  function handleDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${business.location.lat},${business.location.lng}`;
    window.open(url, "_blank");
  }

  function handleSelectEvent(id: string) {
    nav({ to: "/event/$eventId", params: { eventId: id } });
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <Link
          to="/marketplace"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-base truncate">{business.name}</h1>
        </div>
        <FollowBusinessButton isFollowing={business.isFollowing} onToggle={handleFollow} />
        <button
          onClick={handleShare}
          aria-label="Compartilhar"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 px-5 pb-4 overflow-y-auto no-scrollbar">
        <BusinessDetails
          business={business}
          onShare={handleShare}
          onFavorite={handleFavorite}
          onSave={handleSave}
          onDirections={handleDirections}
        />

        {filteredCoupons.length > 0 && (
          <div className="mt-5">
            <CouponList coupons={filteredCoupons} title={`Cupons (${filteredCoupons.length})`} />
          </div>
        )}
      </div>

      <div className="px-5 pb-4 space-y-2">
        <button
          onClick={handleDirections}
          className="w-full rounded-full bg-gradient-brand py-3.5 text-white font-semibold shadow-elegant flex items-center justify-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Ir até lá
        </button>
      </div>
    </div>
  );
}
