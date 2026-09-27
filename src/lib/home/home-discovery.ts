import { places } from "@/lib/mock-data";
import {
  CatalogKind,
  listCatalogByKind,
  mergeCatalogEvents,
  mergeCatalogPlaces,
} from "@/lib/catalog/local-catalog";
import { getAllBusinesses, MOCK_EVENTS } from "@/lib/marketplace/mock-businesses";
import { HOME_EVENTS } from "@/lib/feed/home-premium";
import { formatDistance, sortByDistanceMeters } from "@/lib/proximity";

export const NEARBY_PAGE_SIZE = 5;
export const CONNECT_PULSE_LIMIT = 10;

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

export function listHomeDiscoveryItems(): HomeDiscoveryItem[] {
  const discovered: HomeDiscoveryItem[] = [];

  for (const place of mergeCatalogPlaces(places)) {
    discovered.push(
      item(
        "place",
        place.id,
        place.name,
        place.cover,
        place.distanceMeters,
        place.category,
        place.id,
      ),
    );
  }

  const businesses = getAllBusinesses();
  for (const business of businesses) {
    discovered.push(
      item(
        "business",
        business.id,
        business.name,
        business.photos.find((photo) => photo.isPrimary)?.url ?? business.photos[0]?.url,
        business.distanceMeters,
        business.category,
        business.id,
      ),
    );
    for (const promotion of business.promotions) {
      if (!promotion.isActive) continue;
      discovered.push(
        item(
          "offer",
          promotion.id,
          promotion.title,
          business.photos[0]?.url,
          business.distanceMeters,
          business.name,
          business.id,
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
      ),
    );
  }

  for (const event of HOME_EVENTS) {
    discovered.push(
      item(
        "event",
        event.id,
        event.name,
        event.banner,
        event.distanceMeters,
        event.location,
        event.id,
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
      ),
    );
  }

  return sortByDistanceMeters(uniqueById(discovered));
}

export function listConnectPulseItems(): HomeDiscoveryItem[] {
  const all = listHomeDiscoveryItems().filter((entry) => Boolean(entry.image));
  const byKind: HomeDiscoveryKind[] = ["event", "business", "place", "offer"];
  const buckets = new Map<HomeDiscoveryKind, HomeDiscoveryItem[]>(
    byKind.map((kind) => [kind, all.filter((entry) => entry.kind === kind)]),
  );
  const mixed: HomeDiscoveryItem[] = [];
  let index = 0;
  while (mixed.length < CONNECT_PULSE_LIMIT) {
    const kind = byKind[index % byKind.length];
    const next = buckets.get(kind)?.shift();
    if (next) mixed.push(next);
    index += 1;
    if (index > CONNECT_PULSE_LIMIT * byKind.length) break;
  }
  return mixed.length > 0 ? mixed : all.slice(0, CONNECT_PULSE_LIMIT);
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
