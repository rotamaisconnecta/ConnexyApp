import { places, type Place } from "@/lib/mock-data";
import { HOME_EVENTS, type HomeEvent } from "@/lib/feed/home-premium";
import { allEngineEvents } from "@/lib/engine/engine-detail";
import { MOCK_EVENTS, MOCK_EXTRA_EVENTS } from "@/lib/marketplace/mock-businesses";
import type { BusinessEvent } from "@/lib/marketplace/business-types";
import { EventStatus } from "@/lib/marketplace/business-types";
import {
  CatalogKind,
  listCatalogByKind,
  mergeCatalogEvents,
  mergeCatalogPlaces,
} from "@/lib/catalog/local-catalog";

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

export function parseHomeEventDate(dateLabel: string, time: string, now: Date = new Date()): Date {
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

export function homeEventToBusinessEvent(event: HomeEvent): BusinessEvent {
  const startDate = parseHomeEventDate(event.date, event.time);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: event.id,
    businessId: "",
    title: event.name,
    description: `${event.category ?? "Evento"} perto de você. ${event.location}.`,
    photo: event.banner,
    startDate,
    endDate,
    location: event.location,
    status: event.date === "Hoje" ? EventStatus.ONGOING : EventStatus.UPCOMING,
    attendeesCount: event.participants,
    isFeatured: false,
  };
}

export function nearbyPlaceToBusinessEvent(place: Place): BusinessEvent {
  const now = new Date();
  const timeMatch = place.hours.match(/(\d{1,2}):(\d{2})/);
  const startDate = new Date(now);
  if (timeMatch) {
    startDate.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  }
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const happeningToday = place.hours.toLowerCase().includes("hoje");
  return {
    id: place.id,
    businessId: "",
    title: place.name,
    description: place.description,
    photo: place.cover,
    startDate,
    endDate,
    location: place.address ?? place.name,
    status: happeningToday ? EventStatus.ONGOING : EventStatus.UPCOMING,
    attendeesCount: 0,
    isFeatured: false,
  };
}

export function listNearbyPlaceEvents(): BusinessEvent[] {
  return mergeCatalogPlaces(places)
    .filter((place) => place.category === "Eventos")
    .map(nearbyPlaceToBusinessEvent);
}

export function listCatalogHomeEvents(opts?: { today?: boolean }): HomeEvent[] {
  const pad = (value: number) => String(value).padStart(2, "0");
  const now = new Date();
  return listCatalogByKind(CatalogKind.EVENT)
    .filter((entity) => {
      if (opts?.today === undefined) return true;
      const start = new Date(entity.startAt);
      const isToday =
        start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth() &&
        start.getDate() === now.getDate();
      return opts.today ? isToday : !isToday;
    })
    .map((entity) => {
      const start = new Date(entity.startAt);
      return {
        id: entity.id,
        name: entity.title,
        banner:
          entity.photo || "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
        date: `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`,
        time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        participants: 0,
        distance: "perto",
        distanceMeters: 0,
        location: entity.location,
        category: "Eventos",
      };
    });
}

export function listLocalEvents(): BusinessEvent[] {
  const combined = mergeCatalogEvents([
    ...listNearbyPlaceEvents(),
    ...MOCK_EVENTS,
    ...MOCK_EXTRA_EVENTS,
    ...HOME_EVENTS.map(homeEventToBusinessEvent),
    ...allEngineEvents(),
  ]);
  const seen = new Set<string>();
  const events: BusinessEvent[] = [];
  for (const event of combined) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    events.push(event);
  }
  return events;
}

export function resolveLocalEventById(id: string): BusinessEvent | undefined {
  return listLocalEvents().find((event) => event.id === id);
}
