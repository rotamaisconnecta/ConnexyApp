import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { NotFoundState } from "@/components/navigation/not-found";
import { BusinessCard } from "@/components/marketplace/business-card";
import { EventList } from "@/components/marketplace/event-list";
import { PresenceCheckin } from "@/components/event-checkin/presence-checkin";
import { PresentList } from "@/components/event-checkin/present-list";
import { DetailActionBar, RecentReviewSection } from "@/components/marketplace/local-engagement";
import { Calendar, CarFront, MapPinned, Share2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Business, BusinessEvent } from "@/lib/marketplace/business-types";
import { EventStatus } from "@/lib/marketplace/business-types";
import {
  MOCK_EVENTS,
  MOCK_EXTRA_EVENTS,
  MOCK_BUSINESSES,
  getEventById,
} from "@/lib/marketplace/mock-businesses";
import { HOME_EVENTS, type HomeEvent } from "@/lib/feed/home-premium";
import { allEngineEvents } from "@/lib/engine/engine-detail";
import {
  getEventStatusLabel,
  getEventStatusBgColor,
  formatEventDateTimeRange,
  formatEventPrice,
  formatEventCapacity,
  getEventCapacityPercent,
} from "@/lib/marketplace/event-utils";

export const Route = createFileRoute("/_app/event/$eventId")({
  head: ({ params }) => ({
    meta: [{ title: "Evento — Connexy" }],
  }),
  loader: ({ params }) => {
    const event = ALL_EVENTS.find((e) => e.id === params.eventId);
    if (!event) throw notFound();
    return event;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => (
    <NotFoundState
      title="Evento não encontrado"
      description="O evento que você procura não existe ou foi removido."
      fallbackTo="/events"
    />
  ),
  component: EventDetailPage,
});

const MONTH_ABBR: Record<string, number> = {
  Jan: 0,
  Fev: 1,
  Mar: 2,
  Abr: 3,
  Mai: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Set: 8,
  Out: 9,
  Nov: 10,
  Dez: 11,
};

function parseHomeEventDate(dateLabel: string, time: string): Date {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  if (dateLabel === "Hoje") {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  }
  const match = dateLabel.match(/(\d{1,2}) ([A-Za-z]{3})/);
  if (match) {
    const day = Number(match[1]);
    const month = MONTH_ABBR[match[2]] ?? 0;
    return new Date(now.getFullYear(), month, day, h, m);
  }
  return new Date(now);
}

function homeEventToBusinessEvent(e: HomeEvent): BusinessEvent {
  const startDate = parseHomeEventDate(e.date, e.time);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: e.id,
    businessId: "",
    title: e.name,
    description: `${e.category ?? "Evento"} perto de você. ${e.location}.`,
    photo: e.banner,
    startDate,
    endDate,
    location: e.location,
    status: e.date === "Hoje" ? EventStatus.ONGOING : EventStatus.UPCOMING,
    attendeesCount: e.participants,
    isFeatured: false,
  };
}

const ALL_EVENTS: BusinessEvent[] = [
  ...MOCK_EVENTS,
  ...MOCK_EXTRA_EVENTS,
  ...HOME_EVENTS.map(homeEventToBusinessEvent),
  ...allEngineEvents(),
];

function EventDetailPage() {
  const event = Route.useLoaderData() as BusinessEvent;
  const nav = useNavigate();
  const [isAttending, setIsAttending] = useState(false);

  const hostBusiness = useMemo<Business | undefined>(
    () => (event.businessId ? MOCK_BUSINESSES.find((b) => b.id === event.businessId) : undefined),
    [event.businessId],
  );

  const relatedEvents = useMemo(
    () => ALL_EVENTS.filter((e) => e.id !== event.id).slice(0, 4),
    [event.id],
  );

  const capacityPercent = getEventCapacityPercent(event.attendeesCount, event.capacity ?? 0);

  async function handleShare() {
    const data = {
      title: `${event.title} no Connexy`,
      text: `Veja o evento ${event.title} no Connexy.`,
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

  function handleAttend() {
    setIsAttending(!isAttending);
  }

  function handleSelectBusiness(id: string) {
    nav({ to: "/business/$businessId", params: { businessId: id } });
  }

  function handleSelectEvent(id: string) {
    nav({ to: "/event/$eventId", params: { eventId: id } });
  }

  function openMaps() {
    const destination = hostBusiness
      ? `${hostBusiness.location.lat},${hostBusiness.location.lng}`
      : event.location || event.title;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton
          fallbackTo="/events"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h1 className="font-display font-bold text-base truncate">Evento</h1>
        </div>
        <button
          onClick={handleShare}
          aria-label="Compartilhar"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 px-5 pb-4 space-y-5 overflow-y-auto no-scrollbar">
        {event.photo && (
          <div className="h-48 rounded-2xl overflow-hidden">
            <img src={event.photo} alt={event.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getEventStatusBgColor(event.status)}`}
            >
              {getEventStatusLabel(event.status)}
            </span>
            {event.isFeatured && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/15 text-amber">
                Destaque
              </span>
            )}
          </div>

          <h2 className="font-display font-bold text-xl">{event.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        </div>

        <div className="space-y-2 rounded-2xl bg-secondary/50 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {formatEventDateTimeRange(event.startDate, event.endDate)}
            </span>
          </div>
          {event.location && (
            <div className="text-sm text-muted-foreground">📍 {event.location}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vagas</span>
            <span className="font-medium">
              {formatEventCapacity(event.attendeesCount, event.capacity)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPercent > 80 ? "bg-error" : "bg-primary"
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-secondary/50 p-4">
          <div>
            <div className="text-2xl font-bold">{formatEventPrice(event.price)}</div>
            <div className="text-[11px] text-muted-foreground">por pessoa</div>
          </div>
          <button
            onClick={handleAttend}
            className={`h-12 px-6 rounded-full font-semibold text-sm transition-all ${
              isAttending
                ? "bg-secondary text-muted-foreground"
                : "bg-gradient-brand text-white shadow-elegant"
            }`}
          >
            {isAttending ? "Cancelar" : "Participar"}
          </button>
        </div>

        <div className="space-y-2 rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" />
            Quem está presente?
          </div>
          <PresenceCheckin
            target={{ id: event.id, name: event.title, type: "event" }}
            label="Presença no evento"
          />
          <p className="text-[11px] text-white/80">
            Antes de confirmar, escolha quem poderá ver sua presença.
          </p>
        </div>

        <PresentList targetId={event.id} title="Presentes no evento" />

        <DetailActionBar
          targetId={event.id}
          title={event.title}
          phone={hostBusiness?.phone ?? "+551140000000"}
          outing={{
            id: event.id,
            title: event.title,
            address: event.location ?? null,
            latitude: hostBusiness?.location.lat ?? null,
            longitude: hostBusiness?.location.lng ?? null,
          }}
        />

        <RecentReviewSection
          targetId={event.id}
          initialReviews={[
            { author: "Juliana C.", rating: 5, text: "Organização ótima e clima muito bom." },
            { author: "Rafael P.", rating: 4, text: "Uma experiência que vale repetir." },
          ]}
        />

        {hostBusiness && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Organizador</h3>
            <BusinessCard business={hostBusiness} onSelect={handleSelectBusiness} />
          </div>
        )}

        {relatedEvents.length > 0 && (
          <EventList events={relatedEvents} title="Outros eventos" onSelect={handleSelectEvent} />
        )}
      </div>

      <div className="space-y-2 px-5 pb-4">
        <Link
          to="/ride/request"
          search={{
            destinationName: event.title,
            destinationAddress: event.location ?? null,
            destinationLat: hostBusiness?.location.lat ?? null,
            destinationLng: hostBusiness?.location.lng ?? null,
            source: "event",
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-elegant transition active:scale-[0.98]"
        >
          <CarFront className="h-4 w-4" /> Pedir corrida pelo Connexy
          <span className="text-xs opacity-80">pelo Connexy</span>
        </Link>
        <button
          type="button"
          onClick={openMaps}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border py-3.5 text-sm font-semibold transition hover:bg-secondary active:scale-[0.98]"
        >
          <MapPinned className="h-4 w-4 text-primary" /> Abrir no Google Maps
        </button>
      </div>
    </div>
  );
}
