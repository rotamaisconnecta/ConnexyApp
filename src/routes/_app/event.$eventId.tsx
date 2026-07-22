import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BusinessCard } from "@/components/marketplace/business-card";
import { EventCalendar } from "@/components/marketplace/event-calendar";
import { EventList } from "@/components/marketplace/event-list";
import { ChevronLeft, Calendar, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import type {
  Business,
  BusinessEvent,
  BusinessPhoto,
  BusinessRating,
  BusinessHoursSlot,
} from "@/lib/marketplace/business-types";
import {
  BusinessCategory,
  PriceRange,
  DayOfWeek,
  EventStatus,
  DiscountType,
} from "@/lib/marketplace/business-types";
import {
  getEventStatusLabel,
  getEventStatusBgColor,
  formatEventDate,
  formatEventTime,
  formatEventDateTimeRange,
  formatAttendeesCount,
  getEventCapacityPercent,
} from "@/lib/marketplace/event-utils";

export const Route = createFileRoute("/_app/event/$eventId")({
  head: () => ({ meta: [{ title: "Evento" }] }),
  component: EventDetailPage,
});

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

const MOCK_HOST_BUSINESS: Business = {
  id: "b1",
  name: "Bistrô Paulista",
  slug: "bistro-paulista",
  description: "Gastronomia contemporânea com ingredientes frescos",
  category: BusinessCategory.RESTAURANT,
  photos: [],
  location: { lat: -23.555, lng: -46.655 },
  address: "Av. Paulista, 1500 - São Paulo, SP",
  rating: createMockRating(4.7, 320),
  priceRange: PriceRange.EXPENSIVE,
  distanceMeters: 850,
  isFavorite: false,
  isFollowing: false,
  isOpen: true,
  hours: [],
  tags: [],
  promotions: [],
  events: [],
  couponCount: 0,
  createdAt: new Date("2024-01-15"),
};

const MOCK_EVENT: BusinessEvent = {
  id: "evt-1",
  businessId: "b1",
  title: "Noite de Jazz",
  description:
    "Venha aproveitar uma noite inesquecível com o melhor jazz da cidade. Quarteto instrumental com repertório que vai do clássico ao contemporâneo. Espaço limitado, garanta seu lugar!",
  photo: "https://picsum.photos/seed/jazz-night/600/300",
  startDate: new Date("2026-07-25T20:00:00"),
  endDate: new Date("2026-07-25T23:00:00"),
  location: "Salão principal do Bistrô Paulista",
  status: EventStatus.UPCOMING,
  price: 35,
  capacity: 80,
  attendeesCount: 42,
  isFeatured: true,
};

const RELATED_EVENTS: BusinessEvent[] = [
  {
    id: "evt-2",
    businessId: "b1",
    title: "Degustação de Vinhos",
    description: "Degustação guiada dos melhores vinhos importados da Toscana",
    startDate: new Date("2026-08-05T19:00:00"),
    endDate: new Date("2026-08-05T21:30:00"),
    status: EventStatus.UPCOMING,
    price: 89,
    capacity: 30,
    attendeesCount: 18,
    isFeatured: false,
  },
  {
    id: "evt-3",
    businessId: "b3",
    title: "Festa Junina",
    description: "Arraial com comidas típicas, forró e fogos",
    photo: "https://picsum.photos/seed/festa-junina/400/200",
    startDate: new Date("2026-06-12T18:00:00"),
    endDate: new Date("2026-06-12T23:00:00"),
    location: "Área externa",
    status: EventStatus.FINISHED,
    price: 0,
    capacity: 150,
    attendeesCount: 120,
    isFeatured: false,
  },
];

function EventDetailPage() {
  const params = Route.useParams();
  const nav = useNavigate();
  const [isAttending, setIsAttending] = useState(false);

  const event = MOCK_EVENT;
  const hostBusiness = MOCK_HOST_BUSINESS;
  const capacityPercent = getEventCapacityPercent(event.attendeesCount, event.capacity ?? 0);

  function handleShare() {}

  function handleAttend() {
    setIsAttending(!isAttending);
  }

  function handleSelectBusiness(id: string) {
    nav({ to: "/business/$businessId", params: { businessId: id } });
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
              {event.attendeesCount}/{event.capacity} participantes
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
            <div className="text-2xl font-bold">
              {event.price === 0 ? "Grátis" : `R$ ${event.price!.toFixed(2).replace(".", ",")}`}
            </div>
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

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Organizador</h3>
          <BusinessCard business={hostBusiness} onSelect={handleSelectBusiness} />
        </div>

        {RELATED_EVENTS.length > 0 && (
          <EventList events={RELATED_EVENTS} title="Outros eventos" onSelect={handleSelectEvent} />
        )}
      </div>
    </div>
  );
}
