import { currentUser, places } from "@/lib/mock-data";
import {
  CatalogKind,
  listCatalogByKind,
  mergeCatalogEvents,
  mergeCatalogPlaces,
} from "@/lib/catalog/local-catalog";
import { getAllBusinesses, MOCK_EVENTS } from "@/lib/marketplace/mock-businesses";
import { HOME_EVENTS } from "@/lib/feed/home-premium";
import { parseHomeEventDate } from "@/lib/marketplace/local-event-lookup";
import { formatDistance, sortByDistanceMeters } from "@/lib/proximity";
import {
  isBusinessOpenAt,
  isPlaceOpenAt,
  pulseMetaLine,
  rankPulseItems,
} from "@/lib/home/pulse-relevance";

export const NEARBY_PAGE_SIZE = 5;
export const CONNECT_PULSE_LIMIT = 5;
const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

export type HomeDiscoveryKind = "place" | "business" | "event" | "offer";

export type HomeDiscoveryItem = {
  id: string;
  kind: HomeDiscoveryKind;
  title: string;
  subtitle: string;
  image: string;
  distanceMeters: number;
  distanceLabel: string;
  /** Id do recurso na rota de detalhe (sem o prefixo de `kind`). */
  detailId?: string;
  /** Texto já existente na entidade — sem conteúdo inventado. */
  summary?: string;
  whenLabel?: string;
  whereLabel?: string;
  category?: string;
  openNow?: boolean;
  isActiveOffer?: boolean;
  startAt?: number;
  endAt?: number;
  createdAt?: number;
  tags?: string[];
  favorite?: boolean;
};

export type HomeDiscoveryDetailTarget =
  | { to: "/local/$id"; params: { id: string } }
  | { to: "/business/$businessId"; params: { businessId: string } }
  | { to: "/event/$eventId"; params: { eventId: string } }
  | { to: "/marketplace"; params?: never; search?: never };

/** Rota de detalhe do item. Ofertas abrem no negócio que as hospeda. */
export function getHomeDiscoveryNavigation(
  item: HomeDiscoveryItem,
): HomeDiscoveryDetailTarget | null {
  const id = item.detailId ?? item.id.split(":").slice(1).join(":");
  if (!id) return null;
  if (item.kind === "place") return { to: "/local/$id", params: { id } };
  if (item.kind === "business") return { to: "/business/$businessId", params: { businessId: id } };
  if (item.kind === "event") return { to: "/event/$eventId", params: { eventId: id } };
  if (!item.detailId) return null;
  return { to: "/business/$businessId", params: { businessId: id } };
}

const KIND_LABEL: Record<HomeDiscoveryKind, string> = {
  place: "Local",
  business: "Negócio",
  event: "Evento",
  offer: "Oferta",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800";

function item(
  kind: HomeDiscoveryKind,
  id: string,
  title: string,
  image: string | undefined,
  distanceMeters: number,
  extra?: string,
  detailId?: string,
  summary?: string,
  extras?: Partial<HomeDiscoveryItem>,
): HomeDiscoveryItem {
  const kindLabel = KIND_LABEL[kind];
  return {
    id: `${kind}:${id}`,
    kind,
    title,
    subtitle: extra ? `${kindLabel} · ${extra}` : kindLabel,
    image: image || FALLBACK_IMAGE,
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    detailId,
    summary: summary?.trim() || undefined,
    ...extras,
  };
}

function uniqueById(items: HomeDiscoveryItem[]): HomeDiscoveryItem[] {
  const seen = new Set<string>();
  const unique: HomeDiscoveryItem[] = [];
  for (const entry of items) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    unique.push(entry);
  }
  return unique;
}

const favoriteIds = new Set(currentUser.favoritePlaceIds ?? []);

export function listHomeDiscoveryItems(now: Date = new Date()): HomeDiscoveryItem[] {
  const discovered: HomeDiscoveryItem[] = [];

  for (const place of mergeCatalogPlaces(places)) {
    const openNow = isPlaceOpenAt(place.hours, now);
    discovered.push(
      item(
        "place",
        place.id,
        place.name,
        place.cover,
        place.distanceMeters,
        place.category,
        place.id,
        place.description,
        {
          whenLabel: place.hours || undefined,
          whereLabel: place.address,
          category: place.category,
          openNow,
          tags: [place.category],
          favorite: favoriteIds.has(place.id),
        },
      ),
    );
  }

  const businesses = getAllBusinesses();
  for (const business of businesses) {
    const openNow = isBusinessOpenAt(business, now);
    const photo = business.photos.find((entry) => entry.isPrimary)?.url ?? business.photos[0]?.url;
    discovered.push(
      item(
        "business",
        business.id,
        business.name,
        photo,
        business.distanceMeters,
        business.category,
        business.id,
        business.description,
        {
          whenLabel: openNow ? "Aberto agora" : undefined,
          whereLabel: business.address || business.location.label,
          category: business.category,
          openNow,
          tags: business.tags,
          createdAt: business.createdAt.getTime(),
        },
      ),
    );
    for (const promotion of business.promotions) {
      if (!promotion.isActive) continue;
      discovered.push(
        item(
          "offer",
          promotion.id,
          promotion.title,
          photo,
          business.distanceMeters,
          business.name,
          business.id,
          promotion.description,
          {
            whenLabel: "Disponível agora",
            whereLabel: business.name,
            category: business.category,
            openNow,
            isActiveOffer: true,
            tags: business.tags,
          },
        ),
      );
    }
  }

  for (const event of mergeCatalogEvents(MOCK_EVENTS)) {
    const host = businesses.find((business) => business.id === event.businessId);
    discovered.push(
      item(
        "event",
        event.id,
        event.title,
        event.photo ?? host?.photos[0]?.url,
        host?.distanceMeters ?? 1500,
        event.location ?? host?.name,
        event.id,
        event.description,
        {
          whenLabel: undefined,
          whereLabel: event.location ?? host?.name,
          category: event.title,
          startAt: event.startDate.getTime(),
          endAt: event.endDate.getTime(),
        },
      ),
    );
  }

  for (const event of HOME_EVENTS) {
    const start = parseHomeEventDate(event.date, event.time, now);
    discovered.push(
      item(
        "event",
        event.id,
        event.name,
        event.banner,
        event.distanceMeters,
        event.location,
        event.id,
        undefined,
        {
          whenLabel: [event.date, event.time].filter(Boolean).join(" · "),
          whereLabel: event.location,
          category: event.category,
          startAt: start.getTime(),
          endAt: start.getTime() + EVENT_DURATION_MS,
        },
      ),
    );
  }

  for (const offer of listCatalogByKind(CatalogKind.OFFER)) {
    const host = businesses.find((business) => business.id === offer.businessId);
    discovered.push(
      item(
        "offer",
        offer.id,
        offer.title,
        host?.photos[0]?.url,
        host?.distanceMeters ?? 2000,
        host?.name,
        offer.businessId,
        offer.description,
        {
          whenLabel: "Disponível agora",
          whereLabel: host?.name,
          category: host?.category,
          isActiveOffer: true,
          openNow: host ? isBusinessOpenAt(host, now) : false,
        },
      ),
    );
  }

  return sortByDistanceMeters(uniqueById(discovered));
}

function listConnectPulseFeatured(now: Date = new Date()): HomeDiscoveryItem[] {
  const all = listHomeDiscoveryItems(now).filter((entry) => Boolean(entry.image));
  const ranked = rankPulseItems(all, now).slice(0, CONNECT_PULSE_LIMIT);
  return ranked.length > 0 ? ranked : all.slice(0, CONNECT_PULSE_LIMIT);
}

export { listConnectPulseFeatured, KIND_LABEL as HOME_DISCOVERY_KIND_LABEL };

/** Resto do catálogo após o mix contextual — sem seção própria na Home. */
export function listNearbyYouItems(now: Date = new Date()): HomeDiscoveryItem[] {
  const featuredIds = new Set(listConnectPulseFeatured(now).map((entry) => entry.id));
  return listHomeDiscoveryItems(now).filter((entry) => !featuredIds.has(entry.id));
}

/** Descoberta unificada: relevância do momento + itens próximos restantes. */
export function listConnectPulseItems(now: Date = new Date()): HomeDiscoveryItem[] {
  const featured = listConnectPulseFeatured(now);
  const remainder = listNearbyYouItems(now).filter((entry) => Boolean(entry.image));
  const absorbed = paginateNearby(remainder, NEARBY_PAGE_SIZE);
  const combined = uniqueById([...featured, ...absorbed]);
  const present = new Set(combined.map((entry) => entry.kind));
  const extras: HomeDiscoveryItem[] = [];
  for (const kind of ["event", "business"] as const) {
    if (present.has(kind)) continue;
    const extra = rankPulseItems(
      remainder.filter((entry) => entry.kind === kind),
      now,
    )[0];
    if (extra) extras.push(extra);
  }
  return uniqueById([...combined, ...extras]);
}

export function paginateNearby(
  items: readonly HomeDiscoveryItem[],
  limit: number,
): HomeDiscoveryItem[] {
  return items.slice(0, Math.max(0, limit));
}

export function hasMoreNearby(total: number, limit: number): boolean {
  return limit < total;
}

export { pulseMetaLine };
