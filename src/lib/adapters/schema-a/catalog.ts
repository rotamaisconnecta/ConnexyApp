import type {
  CatalogBusiness,
  CatalogEvent,
  CatalogOffer,
  CatalogPlace,
} from "@/lib/catalog/local-catalog";
import { CatalogKind } from "@/lib/catalog/local-catalog";
import type {
  BusinessRow,
  EventRow,
  OfferRow,
  PlaceRow,
} from "@/integrations/supabase/remote/types";
import type { Database } from "../../../../supabase/schema-a.generated.ts";
import { AdapterMappingCode, AdapterMappingError } from "./errors";
import { epochMsToIso, isoToEpochMs, optionalSchemaAUuid, requireSchemaAUuid } from "./ids";

type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];
type PlaceInsert = Database["public"]["Tables"]["places"]["Insert"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"];

function requireOwner(ownerId: string, field: string): string {
  if (!ownerId) {
    throw new AdapterMappingError(
      "Catalog owner is required",
      AdapterMappingCode.MISSING_OWNER,
      field,
    );
  }
  return requireSchemaAUuid(ownerId, field);
}

export function toRemoteBusinessInsert(entity: CatalogBusiness, ownerId: string): BusinessInsert {
  return {
    owner_id: requireOwner(ownerId, "businesses.owner_id"),
    name: entity.name,
    address: entity.address,
    category: entity.category,
    description: entity.description || null,
    cover_url: entity.cover ?? null,
    lat: entity.lat ?? null,
    lng: entity.lng ?? null,
  };
}

export function toDomainBusiness(row: BusinessRow): CatalogBusiness {
  return {
    id: row.id,
    kind: CatalogKind.BUSINESS,
    ownerId: row.owner_id,
    createdAt: isoToEpochMs(row.created_at),
    updatedAt: isoToEpochMs(row.updated_at),
    name: row.name,
    category: row.category as CatalogBusiness["category"],
    address: row.address,
    description: row.description ?? "",
    cover: row.cover_url ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  };
}

export function toRemotePlaceInsert(entity: CatalogPlace, ownerId: string): PlaceInsert {
  return {
    owner_id: requireOwner(ownerId, "places.owner_id"),
    name: entity.name,
    address: entity.address,
    category: entity.category || null,
    description: entity.description || null,
    hours: entity.hours ?? null,
    cover_url: entity.cover ?? null,
    lat: entity.lat ?? null,
    lng: entity.lng ?? null,
  };
}

export function toDomainPlace(row: PlaceRow): CatalogPlace {
  return {
    id: row.id,
    kind: CatalogKind.PLACE,
    ownerId: row.owner_id ?? "",
    createdAt: isoToEpochMs(row.created_at),
    updatedAt: isoToEpochMs(row.updated_at),
    name: row.name,
    category: row.category ?? "",
    address: row.address,
    description: row.description ?? "",
    hours: row.hours ?? undefined,
    cover: row.cover_url ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  };
}

export function toRemoteEventInsert(entity: CatalogEvent, ownerId: string): EventInsert {
  return {
    owner_id: requireOwner(ownerId, "events.owner_id"),
    title: entity.title,
    location: entity.location,
    start_at: entity.startAt,
    end_at: entity.endAt || null,
    description: entity.description || null,
    capacity: entity.capacity ?? null,
    price: entity.price ?? null,
    photo_url: entity.photo ?? null,
    business_id: entity.businessId ? optionalSchemaAUuid(entity.businessId) : null,
  };
}

export function toDomainEvent(row: EventRow): CatalogEvent {
  return {
    id: row.id,
    kind: CatalogKind.EVENT,
    ownerId: row.owner_id,
    createdAt: isoToEpochMs(row.created_at),
    updatedAt: isoToEpochMs(row.updated_at),
    title: row.title,
    description: row.description ?? "",
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at ?? "",
    capacity: row.capacity ?? undefined,
    price: row.price ?? undefined,
    photo: row.photo_url ?? undefined,
    businessId: row.business_id ?? undefined,
  };
}

export function toRemoteOfferInsert(entity: CatalogOffer, ownerId: string): OfferInsert {
  return {
    owner_id: requireOwner(ownerId, "offers.owner_id"),
    business_id: requireSchemaAUuid(entity.businessId, "offers.business_id"),
    title: entity.title,
    description: entity.description || null,
    discount_value: entity.discountValue,
    valid_until: entity.validUntil,
  };
}

export function toDomainOffer(row: OfferRow): CatalogOffer {
  return {
    id: row.id,
    kind: CatalogKind.OFFER,
    ownerId: row.owner_id,
    createdAt: isoToEpochMs(row.created_at),
    updatedAt: isoToEpochMs(row.updated_at),
    businessId: row.business_id,
    title: row.title,
    description: row.description ?? "",
    discountValue: row.discount_value,
    validUntil: row.valid_until,
  };
}

/** Event status in marketplace mocks is derived from start/end, not a Schema A column. */
export function derivedEventIsUpcoming(startAt: string, now = Date.now()): boolean {
  return Date.parse(startAt) > now;
}
