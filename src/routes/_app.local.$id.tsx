import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { places } from "@/lib/mock-data";
import { enginePlaceById } from "@/lib/engine/engine-detail";
import { proximityLabel } from "@/lib/proximity";
import { PresenceCheckin } from "@/components/event-checkin/presence-checkin";
import { PresentList } from "@/components/event-checkin/present-list";
import { PlaceStatusMeta } from "@/lib/integration/integration-types";
import { usePresence } from "@/providers/presence/presence-provider";
import {
  Star,
  Phone,
  Navigation,
  Bookmark,
  Share2,
  Users,
  MapPinned,
  CarFront,
} from "lucide-react";

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
        <div className="absolute top-14 right-4 flex gap-2">
          <button className="h-10 w-10 grid place-items-center rounded-full bg-white/90">
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 grid place-items-center rounded-full bg-white/90">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
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
          <span>{proximityLabel(p.distanceMeters)}</span>
          <span>·</span>
          <span>{p.hours}</span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.description}</p>

        {p.promo && (
          <div className="mt-4 rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
            <div className="text-[11px] uppercase opacity-90">Promoção</div>
            <div className="font-display text-lg font-bold">{p.promo}</div>
            <button className="mt-2 rounded-full bg-white text-primary text-xs font-semibold px-3 py-1.5">
              Usar promoção
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { Icon: Phone, label: "Ligar" },
            { Icon: Navigation, label: "Rota" },
            { Icon: Bookmark, label: "Salvar" },
            { Icon: Share2, label: "Compartilhar" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3 text-[11px] font-semibold"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </button>
          ))}
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
          <h2 className="font-display font-bold text-sm mb-2">Avaliações recentes</h2>
          <div className="space-y-2">
            {[
              { n: "Ana R.", t: "Ambiente ótimo, café espetacular." },
              { n: "Pedro L.", t: "Atendimento rápido e simpático." },
            ].map((r) => (
              <div key={r.n} className="rounded-2xl border border-border p-3">
                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  {r.n} · <span className="text-amber-500">★★★★★</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{r.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {p.lat != null && p.lng != null ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.lat},${p.lng}`)}`}
            target="_blank"
            rel="noopener,noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-full border-2 border-border py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            <MapPinned className="h-4 w-4 text-primary" />
            Abrir no Google Maps
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full rounded-full border-2 border-border py-3.5 text-sm font-semibold text-muted-foreground">
            <MapPinned className="h-4 w-4" />
            Localização indisponível
          </div>
        )}
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
          Pedir corrida
          <span className="text-xs opacity-80">Pelo Connexy</span>
        </Link>
      </div>
    </div>
  );
}
