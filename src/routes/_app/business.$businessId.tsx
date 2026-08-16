import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { NotFoundState } from "@/components/navigation/not-found";
import { BusinessHeader } from "@/components/marketplace/business-header";
import { BusinessDetails } from "@/components/marketplace/business-details";
import { CouponList } from "@/components/marketplace/coupon-list";
import { FollowBusinessButton } from "@/components/marketplace/follow-business-button";
import { Navigation, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import type { Business } from "@/lib/marketplace/business-types";
import { MOCK_COUPONS, getBusinessById } from "@/lib/marketplace/mock-businesses";
import { engineBusinessById } from "@/lib/engine/engine-detail";

export const Route = createFileRoute("/_app/business/$businessId")({
  head: ({ params }) => ({
    meta: [{ title: `Empresa — Connexy` }],
  }),
  loader: ({ params }) => {
    const business = getBusinessById(params.businessId) ?? engineBusinessById(params.businessId);
    if (!business) throw notFound();
    return business;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => (
    <NotFoundState
      title="Empresa não encontrada"
      description="O negócio que você procura não existe ou foi removido."
      fallbackTo="/marketplace"
    />
  ),
  component: BusinessDetailPage,
});

function BusinessDetailPage() {
  const initialBusiness = Route.useLoaderData() as Business;
  const nav = useNavigate();
  const [business, setBusiness] = useState<Business>(initialBusiness);

  const filteredCoupons = useMemo(
    () => MOCK_COUPONS.filter((c) => c.businessId === business.id),
    [business.id],
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
        <BackButton
          fallbackTo="/marketplace"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
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
