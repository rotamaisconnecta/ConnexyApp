import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { places } from "@/lib/mock-data";
import { enginePlaceById } from "@/lib/engine/engine-detail";
import { mergeCatalogPlaces } from "@/lib/catalog/local-catalog";
import { formatDistance } from "@/lib/proximity";
import { PresenceCheckin } from "@/components/event-checkin/presence-checkin";
import { PresentList } from "@/components/event-checkin/present-list";
import { CaronaContextSection } from "@/components/carona/carona-context-section";
import {
  DetailActionBar,
  PromotionRedeemCard,
  RecentReviewSection,
} from "@/components/marketplace/local-engagement";
import { PlaceStatusMeta } from "@/lib/integration/integration-types";
import { usePresence } from "@/providers/presence/presence-provider";
import { CalendarDays, Globe, Star, Tag, Users, MapPinned, CarFront } from "lucide-react";
import { isPlaceReservable } from "@/lib/reservations/reservable";
import { buildRideRequestSearch } from "@/lib/mobility/ride-request-context";
import { BusinessHours } from "@/components/marketplace/business-hours";

export const Route = createFileRoute("/_app/local/$id")({
  ssr: false,
  head: ({ loaderData }: { loaderData?: { name: string; cover: string } }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.name} — Connexy` : "Local — Connexy",
      },
      ...(loaderData
        ? [
            { property: "og:title", content: loaderData.name },
            { property: "og:image", content: loaderData.cover },
          ]
        : []),
    ],
  }),
  loader: ({ params }) => {
    const p =
      mergeCatalogPlaces(places).find((item) => item.id === params.id) ??
      enginePlaceById(params.id);
    if (!p) throw notFound();
    return p;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Local não encontrado.</div>,
  component: LocalDetail,
});

function LocalDetail() {
  const p = Route.useLoaderData();
  const { getMetrics } = usePresence();
  const metrics = getMetrics(p.id);
  const movementMeta = PlaceStatusMeta[metrics.movement];

  return (
    <div className="flex-1">
      <div className="relative">
        <img src={p.cover} alt={p.name} className="h-56 w-full object-cover" />
        <div className="absolute inset-x-0 top-0">
          <StatusBar dark />
        </div>
        <BackButton
          fallbackTo="/locais"
          className="absolute top-14 left-4 h-10 w-10 grid place-items-center rounded-full bg-white/90 backdrop-blur"
        />
      </div>

      <div className="px-5 pt-5">
        <div className="text-[11px] uppercase text-primary font-semibold">{p.category}</div>
        <h1 className="font-display text-2xl font-bold">{p.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-0.5">
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" /> {p.rating} (
            {p.reviews} avaliações)
          </span>
          <span>·</span>
          <span className="shrink-0">{formatDistance(p.distanceMeters)}</span>
          <span>·</span>
          <span className="min-w-0 truncate">{p.hours}</span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.description}</p>

        {p.tags && p.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {p.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {p.website && (
          <a
            href={/^https?:\/\//i.test(p.website) ? p.website : `https://${p.website}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <Globe className="h-3.5 w-3.5" />
            {p.website}
          </a>
        )}

        {p.hoursSlots && p.hoursSlots.length > 0 ? (
          <div className="mt-5">
            <BusinessHours hours={p.hoursSlots} />
          </div>
        ) : null}

        {p.promo && (
          <div className="mt-4">
            <PromotionRedeemCard
              targetId={p.id}
              promotionId={`${p.id}-promo`}
              title={p.promo}
              description="Ative pelo Connexy e apresente o código no estabelecimento."
            />
          </div>
        )}

        <div className="mt-5">
          <DetailActionBar
            targetId={p.id}
            title={p.name}
            phone={p.phone}
            outing={{
              id: p.id,
              title: p.name,
              address: p.address,
              latitude: p.lat,
              longitude: p.lng,
            }}
          />
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Quem está presente?
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${movementMeta.bg} ${movementMeta.color}`}
            >
              <span aria-hidden>{movementMeta.emoji}</span> {movementMeta.label}
            </span>
          </div>
          <div className="mt-3">
            <PresenceCheckin target={{ id: p.id, name: p.name, type: "place" }} label="Presença" />
          </div>
          <p className="mt-2 text-[11px] text-white/80">
            Antes de confirmar, escolha quem poderá ver sua presença.
          </p>
        </div>

        <div className="mt-5">
          <PresentList targetId={p.id} title="Presentes agora" />
        </div>

        <div className="mt-5">
          <CaronaContextSection destination={p.name} contextType="local" contextId={p.id} />
        </div>

        <div className="mt-6">
          <RecentReviewSection
            targetId={p.id}
            initialReviews={[
              { author: "Ana R.", rating: 5, text: "Ambiente ótimo, experiência especial." },
              { author: "Pedro L.", rating: 5, text: "Atendimento rápido e simpático." },
            ]}
          />
        </div>
      </div>

      <div className="p-5 space-y-3">
        {isPlaceReservable(p) && (
          <Link
            to="/reserva/$resourceId"
            params={{ resourceId: p.id }}
            search={{ type: "place" }}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.98]"
          >
            <CalendarDays className="h-4 w-4" /> Reservar
          </Link>
        )}
        <Link
          to="/ride/request"
          search={buildRideRequestSearch({
            id: p.id,
            name: p.name,
            address: p.address ?? null,
            lat: p.lat ?? null,
            lng: p.lng ?? null,
            source: "local",
          })}
          className="flex items-center justify-center gap-2 w-full rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-elegant transition-all hover:shadow-xl active:scale-[0.98]"
        >
          <CarFront className="h-4 w-4 shrink-0" />
          Pedir corrida pelo Connexy
        </Link>
        {p.lat != null && p.lng != null ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.lat},${p.lng}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            <MapPinned className="h-4 w-4 text-primary" />
            Abrir no Google Maps
          </a>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border py-3.5 text-sm font-semibold text-muted-foreground">
            <MapPinned className="h-4 w-4" />
            Localização indisponível
          </div>
        )}
      </div>
    </div>
  );
}
