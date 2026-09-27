import { demoStorageKey } from "@/lib/demo/demo-config";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import type { Place } from "@/lib/mock-data";
import {
  BusinessCategory,
  DiscountType,
  EventStatus,
  PriceRange,
  type Business,
  type BusinessCategoryValue,
  type BusinessEvent,
  type Promotion,
} from "@/lib/marketplace/business-types";

export const LOCAL_CATALOG_STORAGE_KEY = demoStorageKey("catalog");
export const LOCAL_CATALOG_EVENT = "connexy:demo:catalog";
export const LOCAL_CATALOG_DISCLAIMER =
  "Cadastro local/demo. Não há publicação remota nem catálogo compartilhado entre dispositivos.";

export const CatalogKind = {
  EVENT: "event",
  PLACE: "place",
  OFFER: "offer",
  BUSINESS: "business",
} as const;

export type CatalogKindValue = (typeof CatalogKind)[keyof typeof CatalogKind];

interface CatalogEntityBase {
  id: string;
  kind: CatalogKindValue;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogEvent extends CatalogEntityBase {
  kind: typeof CatalogKind.EVENT;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  price?: number;
  photo?: string;
  businessId?: string;
}

export interface CatalogPlace extends CatalogEntityBase {
  kind: typeof CatalogKind.PLACE;
  name: string;
  category: string;
  address: string;
  description: string;
  hours?: string;
  cover?: string;
  lat?: number;
  lng?: number;
}

export interface CatalogBusiness extends CatalogEntityBase {
  kind: typeof CatalogKind.BUSINESS;
  name: string;
  category: BusinessCategoryValue;
  address: string;
  description: string;
  cover?: string;
  lat?: number;
  lng?: number;
}

export interface CatalogOffer extends CatalogEntityBase {
  kind: typeof CatalogKind.OFFER;
  businessId: string;
  title: string;
  description: string;
  discountValue: number;
  validUntil: string;
}

export type CatalogEntity = CatalogEvent | CatalogPlace | CatalogBusiness | CatalogOffer;

export type CatalogEventInput = Omit<
  CatalogEvent,
  "id" | "kind" | "ownerId" | "createdAt" | "updatedAt"
>;
export type CatalogPlaceInput = Omit<
  CatalogPlace,
  "id" | "kind" | "ownerId" | "createdAt" | "updatedAt"
>;
export type CatalogBusinessInput = Omit<
  CatalogBusiness,
  "id" | "kind" | "ownerId" | "createdAt" | "updatedAt"
>;
export type CatalogOfferInput = Omit<
  CatalogOffer,
  "id" | "kind" | "ownerId" | "createdAt" | "updatedAt"
>;

const DEFAULT_COVER = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800";
const DEFAULT_LAT = -23.561;
const DEFAULT_LNG = -46.656;
const CATALOG_SAVE_ERROR = "Não foi possível salvar no catálogo local.";

function newId(kind: CatalogKindValue): string {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function read(): CatalogEntity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogEntity[];
    return Array.isArray(parsed) ? parsed.filter(isCatalogEntity) : [];
  } catch {
    return [];
  }
}

function isCatalogEntity(value: CatalogEntity | undefined): value is CatalogEntity {
  if (!value || typeof value !== "object") return false;
  if (typeof value.id !== "string" || !value.id) return false;
  if (typeof value.ownerId !== "string" || !value.ownerId) return false;
  return (
    value.kind === CatalogKind.EVENT ||
    value.kind === CatalogKind.PLACE ||
    value.kind === CatalogKind.BUSINESS ||
    value.kind === CatalogKind.OFFER
  );
}

function write(entities: CatalogEntity[]): void {
  if (typeof window === "undefined") throw new Error(CATALOG_SAVE_ERROR);
  window.localStorage.setItem(LOCAL_CATALOG_STORAGE_KEY, JSON.stringify(entities));
  window.dispatchEvent(new CustomEvent(LOCAL_CATALOG_EVENT));
}

function persist<T extends CatalogEntity>(entity: T): T {
  const current = read().filter((item) => item.id !== entity.id);
  write([entity, ...current]);
  return entity;
}

function ownerId(): string {
  return getDemoIdentity().id;
}

export function listCatalogEntities(): CatalogEntity[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function listCatalogByKind<K extends CatalogKindValue>(
  kind: K,
  userId?: string,
): Extract<CatalogEntity, { kind: K }>[] {
  return listCatalogEntities().filter(
    (item): item is Extract<CatalogEntity, { kind: K }> =>
      item.kind === kind && (!userId || item.ownerId === userId),
  );
}

export function getCatalogEntity(id: string): CatalogEntity | null {
  return read().find((item) => item.id === id) ?? null;
}

export function catalogEntityLabel(entity: CatalogEntity): string {
  return entity.kind === CatalogKind.EVENT || entity.kind === CatalogKind.OFFER
    ? entity.title
    : entity.name;
}

export function subscribeLocalCatalog(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_CATALOG_STORAGE_KEY) listener();
  };
  window.addEventListener(LOCAL_CATALOG_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LOCAL_CATALOG_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function createCatalogEvent(input: CatalogEventInput): CatalogEvent {
  const title = input.title.trim();
  const location = input.location.trim();
  if (!title || !location || !input.startAt) {
    throw new Error("Informe título, local e data do evento.");
  }
  const now = Date.now();
  return persist({
    ...input,
    id: newId(CatalogKind.EVENT),
    kind: CatalogKind.EVENT,
    ownerId: ownerId(),
    title,
    description: input.description.trim(),
    location,
    startAt: input.startAt,
    endAt: input.endAt || input.startAt,
    createdAt: now,
    updatedAt: now,
  });
}

export function createCatalogPlace(input: CatalogPlaceInput): CatalogPlace {
  const name = input.name.trim();
  const address = input.address.trim();
  if (!name || !address) {
    throw new Error("Informe nome e endereço do local.");
  }
  const now = Date.now();
  return persist({
    ...input,
    id: newId(CatalogKind.PLACE),
    kind: CatalogKind.PLACE,
    ownerId: ownerId(),
    name,
    category: input.category.trim() || "Lojas",
    address,
    description: input.description.trim(),
    createdAt: now,
    updatedAt: now,
  });
}

export function createCatalogBusiness(input: CatalogBusinessInput): CatalogBusiness {
  const name = input.name.trim();
  const address = input.address.trim();
  if (!name || !address) {
    throw new Error("Informe nome e endereço do negócio.");
  }
  const now = Date.now();
  return persist({
    ...input,
    id: newId(CatalogKind.BUSINESS),
    kind: CatalogKind.BUSINESS,
    ownerId: ownerId(),
    name,
    category: input.category || BusinessCategory.SERVICE,
    address,
    description: input.description.trim(),
    createdAt: now,
    updatedAt: now,
  });
}

export function createCatalogOffer(input: CatalogOfferInput): CatalogOffer {
  const title = input.title.trim();
  const businessId = input.businessId.trim();
  if (!title || !businessId) {
    throw new Error("Informe o título e o negócio da oferta.");
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    throw new Error("Informe um desconto válido.");
  }
  const hosted = getCatalogEntity(businessId);
  if (hosted && hosted.kind !== CatalogKind.BUSINESS) {
    throw new Error("A oferta precisa de um negócio existente.");
  }
  const now = Date.now();
  return persist({
    ...input,
    id: newId(CatalogKind.OFFER),
    kind: CatalogKind.OFFER,
    ownerId: ownerId(),
    title,
    businessId,
    description: input.description.trim(),
    discountValue: input.discountValue,
    validUntil: input.validUntil,
    createdAt: now,
    updatedAt: now,
  });
}

export function catalogEventToBusinessEvent(entity: CatalogEvent): BusinessEvent {
  return {
    id: entity.id,
    businessId: entity.businessId ?? "",
    title: entity.title,
    description: entity.description,
    photo: entity.photo || DEFAULT_COVER,
    startDate: new Date(entity.startAt),
    endDate: new Date(entity.endAt || entity.startAt),
    location: entity.location,
    status: EventStatus.UPCOMING,
    price: entity.price,
    capacity: entity.capacity,
    attendeesCount: 0,
    isFeatured: false,
  };
}

export function catalogPlaceToPlace(entity: CatalogPlace): Place {
  return {
    id: entity.id,
    name: entity.name,
    category: entity.category,
    distanceMeters: 0,
    rating: 0,
    reviews: 0,
    hours: entity.hours?.trim() || "Horário a confirmar",
    cover: entity.cover || DEFAULT_COVER,
    description: entity.description,
    lat: entity.lat ?? DEFAULT_LAT,
    lng: entity.lng ?? DEFAULT_LNG,
    address: entity.address,
  };
}

export function catalogOfferToPromotion(entity: CatalogOffer): Promotion {
  return {
    id: entity.id,
    businessId: entity.businessId,
    title: entity.title,
    description: entity.description,
    discountType: DiscountType.PERCENTAGE,
    discountValue: entity.discountValue,
    validFrom: new Date(entity.createdAt),
    validUntil: new Date(entity.validUntil || entity.createdAt),
    isActive: true,
  };
}

export function catalogBusinessToBusiness(
  entity: CatalogBusiness,
  offers: CatalogOffer[] = listCatalogByKind(CatalogKind.OFFER),
): Business {
  const promotions = offers
    .filter((offer) => offer.businessId === entity.id)
    .map(catalogOfferToPromotion);
  return {
    id: entity.id,
    name: entity.name,
    slug: entity.id,
    description: entity.description,
    category: entity.category,
    photos: [
      {
        id: `${entity.id}-cover`,
        url: entity.cover || DEFAULT_COVER,
        alt: entity.name,
        isPrimary: true,
      },
    ],
    location: {
      lat: entity.lat ?? DEFAULT_LAT,
      lng: entity.lng ?? DEFAULT_LNG,
      label: entity.address,
    },
    address: entity.address,
    rating: {
      average: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    priceRange: PriceRange.MODERATE,
    distanceMeters: 0,
    isFavorite: false,
    isFollowing: false,
    isOpen: true,
    hours: [],
    tags: ["local"],
    promotions,
    events: [],
    couponCount: promotions.length,
    createdAt: new Date(entity.createdAt),
  };
}

export function mergeCatalogPlaces(fixtures: readonly Place[]): Place[] {
  const catalog = listCatalogByKind(CatalogKind.PLACE).map(catalogPlaceToPlace);
  const seen = new Set(catalog.map((item) => item.id));
  return [...catalog, ...fixtures.filter((item) => !seen.has(item.id))];
}

export function mergeCatalogEvents(fixtures: readonly BusinessEvent[]): BusinessEvent[] {
  const catalog = listCatalogByKind(CatalogKind.EVENT).map(catalogEventToBusinessEvent);
  const seen = new Set(catalog.map((item) => item.id));
  return [...catalog, ...fixtures.filter((item) => !seen.has(item.id))];
}

export function mergeCatalogBusinesses(fixtures: readonly Business[]): Business[] {
  const offers = listCatalogByKind(CatalogKind.OFFER);
  const catalog = listCatalogByKind(CatalogKind.BUSINESS).map((entity) =>
    catalogBusinessToBusiness(entity, offers),
  );
  const seen = new Set(catalog.map((item) => item.id));
  const withOffers = fixtures
    .filter((item) => !seen.has(item.id))
    .map((business) => {
      const extra = offers
        .filter((offer) => offer.businessId === business.id)
        .map(catalogOfferToPromotion);
      if (extra.length === 0) return business;
      return {
        ...business,
        promotions: [...business.promotions, ...extra],
        couponCount: business.couponCount + extra.length,
      };
    });
  return [...catalog, ...withOffers];
}
