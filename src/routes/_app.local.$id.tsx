import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { places } from "@/lib/mock-data";
import { enginePlaceById } from "@/lib/engine/engine-detail";
import { formatDistance } from "@/lib/proximity";
import { PresenceCheckin } from "@/components/event-checkin/presence-checkin";
import { PresentList } from "@/components/event-checkin/present-list";
import {
  DetailActionBar,
  PromotionRedeemCard,
  RecentReviewSection,
} from "@/components/marketplace/local-engagement";
import { PlaceStatusMeta } from "@/lib/integration/integration-types";
import { usePresence } from "@/providers/presence/presence-provider";
import { Star, Users, MapPinned, CarFront } from "lucide-react";

export const Route = createFileRoute("/_app/local/$id")({
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
    const p = places.find((x) => x.id === params.id) ?? enginePlaceById(params.id);
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
        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating} ({p.reviews}{" "}
            avaliações)
          </span>
          <span>·</span>
          <span>{formatDistance(p.distanceMeters)}</span>
          <span>·</span>
          <span>{p.hours}</span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.description}</p>

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
            phone="+551140000000"
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
        <Link
          to="/ride/request"
          search={{
            destinationId: p.id,
            destinationName: p.name,
            destinationAddress: p.address ?? null,
            destinationLat: p.lat ?? null,
            destinationLng: p.lng ?? null,
            source: "local",
          }}
          className="flex items-center justify-center gap-2 w-full rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-elegant transition-all hover:shadow-xl active:scale-[0.98]"
        >
          <CarFront className="h-4 w-4" />
          Pedir corrida pelo Connexy
          <span className="text-xs opacity-80">Pelo Connexy</span>
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
