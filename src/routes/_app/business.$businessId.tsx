import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { NotFoundState } from "@/components/navigation/not-found";
import { BusinessDetails } from "@/components/marketplace/business-details";
import { CouponList } from "@/components/marketplace/coupon-list";
import { FollowBusinessButton } from "@/components/marketplace/follow-business-button";
import { FavoriteBusinessButton } from "@/components/marketplace/favorite-business-button";
import {
  DetailActionBar,
  PromotionRedeemCard,
  RecentReviewSection,
} from "@/components/marketplace/local-engagement";
import { isDetailSaved, toggleSavedDetail } from "@/lib/marketplace/saved-details";
import { PresenceCheckin } from "@/components/event-checkin/presence-checkin";
import { CalendarDays, CarFront, MapPinned, Share2, Users } from "lucide-react";
import { isBusinessReservable } from "@/lib/reservations/reservable";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Business } from "@/lib/marketplace/business-types";
import { MOCK_COUPONS, getBusinessById } from "@/lib/marketplace/mock-businesses";
import { engineBusinessById } from "@/lib/engine/engine-detail";

export const Route = createFileRoute("/_app/business/$businessId")({
  ssr: false,
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
  const [isFavorite, setIsFavorite] = useState(() => isDetailSaved(initialBusiness.id));
  const [business, setBusiness] = useState<Business>(() => ({
    ...initialBusiness,
    isFavorite: isDetailSaved(initialBusiness.id),
  }));
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);

  const filteredCoupons = useMemo(
    () => MOCK_COUPONS.filter((c) => c.businessId === business.id),
    [business.id],
  );
  const selectedPromotion =
    business.promotions.find((promotion) => promotion.id === selectedPromotionId) ??
    business.promotions[0];

  function handleFavorite() {
    const nextSaved = toggleSavedDetail(business.id);
    setIsFavorite(nextSaved);
    setBusiness((prev) => ({ ...prev, isFavorite: nextSaved }));
    toast.success(nextSaved ? "Salvo nos seus itens." : "Removido dos itens salvos.");
  }

  function handleFollow() {
    setBusiness((prev) => ({ ...prev, isFollowing: !prev.isFollowing }));
  }

  async function handleShare() {
    const data = {
      title: `${business.name} no Connexy`,
      text: `Veja ${business.name} no Connexy.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copiado para compartilhar.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Não foi possível compartilhar agora.");
    }
  }

  function handleSave() {
    toast.success("Empresa salva nos seus itens.");
  }

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
        <FavoriteBusinessButton isFavorite={isFavorite} onToggle={handleFavorite} />
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
          business={{ ...business, isFavorite }}
          onShare={handleShare}
          onFavorite={handleFavorite}
          onSave={handleSave}
          onDirections={handleDirections}
          onPromotionSelect={setSelectedPromotionId}
        />

        <div className="mt-5">
          <DetailActionBar
            targetId={business.id}
            title={business.name}
            phone={business.phone ?? "+551140000000"}
            saved={isFavorite}
            onToggleSaved={handleFavorite}
            outing={{
              id: business.id,
              title: business.name,
              address: business.address,
              latitude: business.location.lat,
              longitude: business.location.lng,
            }}
          />
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" /> Marque sua presença
          </div>
          <div className="mt-3">
            <PresenceCheckin
              target={{ id: business.id, name: business.name, type: "place" }}
              label="Presença no local"
              compact
            />
          </div>
        </div>

        {selectedPromotion && (
          <div className="mt-5">
            <PromotionRedeemCard
              targetId={business.id}
              promotionId={selectedPromotion.id}
              title={selectedPromotion.title}
              description={selectedPromotion.description}
            />
          </div>
        )}

        {filteredCoupons.length > 0 && (
          <div className="mt-5">
            <CouponList coupons={filteredCoupons} title={`Cupons (${filteredCoupons.length})`} />
          </div>
        )}

        <div className="mt-6">
          <RecentReviewSection
            targetId={business.id}
            initialReviews={[
              {
                author: "Marina A.",
                rating: 5,
                text: "Ótima experiência e atendimento atencioso.",
              },
              { author: "Carlos M.", rating: 4, text: "Voltaria para conhecer outras opções." },
            ]}
          />
        </div>
      </div>

      <div className="px-5 pb-4 space-y-2">
        {isBusinessReservable(business) && (
          <Link
            to="/reserva/$resourceId"
            params={{ resourceId: business.id }}
            search={{ type: "business" }}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.98]"
          >
            <CalendarDays className="h-4 w-4" /> Reservar
          </Link>
        )}
        <Link
          to="/ride/request"
          search={{
            destinationName: business.name,
            destinationAddress: business.address,
            destinationLat: business.location.lat,
            destinationLng: business.location.lng,
            source: "business",
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-elegant transition active:scale-[0.98]"
        >
          <CarFront className="h-4 w-4" /> Pedir corrida pelo Connexy
          <span className="text-xs opacity-80">pelo Connexy</span>
        </Link>
        <button
          type="button"
          onClick={handleDirections}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border py-3.5 text-sm font-semibold text-foreground transition hover:bg-secondary active:scale-[0.98]"
        >
          <MapPinned className="h-4 w-4 text-primary" /> Abrir no Google Maps
        </button>
      </div>
    </div>
  );
}
