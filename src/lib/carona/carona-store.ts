import { demoStorageKey } from "@/lib/demo/demo-config";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import { connectUser, sendLocalMessage } from "@/lib/demo/demo-db";

export const CARONA_STORAGE_KEY = demoStorageKey("carona");
export const CARONA_EVENT = "connexy:demo:carona";

export const CaronaOfferStatus = {
  ACTIVE: "active",
  FULL: "full",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export type CaronaOfferStatusValue = (typeof CaronaOfferStatus)[keyof typeof CaronaOfferStatus];

export const CaronaRequestStatus = {
  REQUESTED: "requested",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type CaronaRequestStatusValue =
  (typeof CaronaRequestStatus)[keyof typeof CaronaRequestStatus];

/** Conceito RideOffer — domínio social, isolado do dispatcher. */
export type CaronaOffer = {
  id: string;
  ownerId: string;
  origin: string;
  destination: string;
  meetup: string;
  date: string;
  time: string;
  availableSeats: number;
  status: CaronaOfferStatusValue;
  createdAt: number;
};

/** Conceito RideRequest — pedido social de vaga.
 * Segurança avançada (denúncia, bloqueio, histórico remoto) fica para
 * o backend; cancelamento e ponto de encontro aproximado já existem. */
export type CaronaRequest = {
  id: string;
  rideOfferId: string;
  requesterId: string;
  status: CaronaRequestStatusValue;
  createdAt: number;
  conversationId?: string;
};

type CaronaStore = {
  offers: CaronaOffer[];
  requests: CaronaRequest[];
};

export type CreateCaronaOfferInput = {
  origin: string;
  destination: string;
  meetup?: string;
  date: string;
  time: string;
  availableSeats: number;
  ownerId?: string;
};

function emptyStore(): CaronaStore {
  return { offers: [], requests: [] };
}

function isOffer(value: unknown): value is CaronaOffer {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.ownerId === "string" &&
    typeof record.origin === "string" &&
    typeof record.destination === "string" &&
    typeof record.meetup === "string" &&
    typeof record.date === "string" &&
    typeof record.time === "string" &&
    typeof record.availableSeats === "number" &&
    (record.status === "active" ||
      record.status === "full" ||
      record.status === "cancelled" ||
      record.status === "completed") &&
    typeof record.createdAt === "number"
  );
}

function isRequest(value: unknown): value is CaronaRequest {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.rideOfferId === "string" &&
    typeof record.requesterId === "string" &&
    (record.status === "requested" ||
      record.status === "accepted" ||
      record.status === "rejected" ||
      record.status === "cancelled") &&
    typeof record.createdAt === "number"
  );
}

function read(): CaronaStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CARONA_STORAGE_KEY) ?? "");
    if (typeof parsed !== "object" || parsed === null) return emptyStore();
    const record = parsed as Record<string, unknown>;
    return {
      offers: Array.isArray(record.offers) ? record.offers.filter(isOffer) : [],
      requests: Array.isArray(record.requests) ? record.requests.filter(isRequest) : [],
    };
  } catch {
    return emptyStore();
  }
}

function write(store: CaronaStore): void {
  if (typeof window === "undefined") throw new Error("Não foi possível salvar a carona.");
  window.localStorage.setItem(CARONA_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(CARONA_EVENT));
}

function approximateLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Região próxima";
  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[0] || trimmed;
}

export function subscribeCarona(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === CARONA_STORAGE_KEY) listener();
  };
  window.addEventListener(CARONA_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CARONA_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function listCaronaOffers(): CaronaOffer[] {
  return read().offers.sort((a, b) => b.createdAt - a.createdAt);
}

export function listDiscoverableCaronaOffers(viewerId = getDemoIdentity().id): CaronaOffer[] {
  return listCaronaOffers().filter(
    (offer) => offer.status === CaronaOfferStatus.ACTIVE && offer.ownerId !== viewerId,
  );
}

export function listMyCaronaOffers(ownerId = getDemoIdentity().id): CaronaOffer[] {
  return listCaronaOffers().filter((offer) => offer.ownerId === ownerId);
}

export function getCaronaOffer(id: string): CaronaOffer | null {
  return listCaronaOffers().find((offer) => offer.id === id) ?? null;
}

export function listCaronaRequestsForOffer(rideOfferId: string): CaronaRequest[] {
  return read()
    .requests.filter((request) => request.rideOfferId === rideOfferId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listMyCaronaRequests(requesterId = getDemoIdentity().id): CaronaRequest[] {
  return read()
    .requests.filter((request) => request.requesterId === requesterId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getCaronaRequest(id: string): CaronaRequest | null {
  return read().requests.find((request) => request.id === id) ?? null;
}

export function createCaronaOffer(input: CreateCaronaOfferInput): CaronaOffer {
  const ownerId = input.ownerId ?? getDemoIdentity().id;
  const origin = approximateLabel(input.origin);
  const destination = approximateLabel(input.destination);
  const offer: CaronaOffer = {
    id: `carona-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ownerId,
    origin,
    destination,
    meetup: approximateLabel(input.meetup || `Ponto combinado em ${origin}`),
    date: input.date,
    time: input.time,
    availableSeats: Math.max(1, Math.min(6, Math.round(input.availableSeats))),
    status: CaronaOfferStatus.ACTIVE,
    createdAt: Date.now(),
  };
  const store = read();
  write({ ...store, offers: [offer, ...store.offers] });
  return offer;
}

export function requestCarona(
  rideOfferId: string,
  requesterId = getDemoIdentity().id,
): CaronaRequest {
  const store = read();
  const offer = store.offers.find((item) => item.id === rideOfferId);
  if (!offer) throw new Error("Carona não encontrada.");
  if (offer.ownerId === requesterId) throw new Error("Você não pode solicitar a própria carona.");
  if (offer.status !== CaronaOfferStatus.ACTIVE)
    throw new Error("Esta carona não está disponível.");
  const existing = store.requests.find(
    (item) =>
      item.rideOfferId === rideOfferId &&
      item.requesterId === requesterId &&
      (item.status === CaronaRequestStatus.REQUESTED ||
        item.status === CaronaRequestStatus.ACCEPTED),
  );
  if (existing) return existing;
  const request: CaronaRequest = {
    id: `carona-req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rideOfferId,
    requesterId,
    status: CaronaRequestStatus.REQUESTED,
    createdAt: Date.now(),
  };
  write({ ...store, requests: [request, ...store.requests] });
  return request;
}

export async function acceptCaronaRequest(
  requestId: string,
  ownerId = getDemoIdentity().id,
): Promise<CaronaRequest> {
  const store = read();
  const request = store.requests.find((item) => item.id === requestId);
  if (!request) throw new Error("Pedido não encontrado.");
  const offer = store.offers.find((item) => item.id === request.rideOfferId);
  if (!offer || offer.ownerId !== ownerId) throw new Error("Só o ofertante pode aceitar.");
  if (request.status === CaronaRequestStatus.ACCEPTED) return request;
  if (request.status !== CaronaRequestStatus.REQUESTED) throw new Error("Pedido indisponível.");
  if (offer.availableSeats < 1 || offer.status !== CaronaOfferStatus.ACTIVE) {
    throw new Error("Não há vagas nesta carona.");
  }

  const connection = await connectUser(request.requesterId, ownerId);
  const nextSeats = offer.availableSeats - 1;
  offer.availableSeats = nextSeats;
  if (nextSeats === 0) offer.status = CaronaOfferStatus.FULL;
  request.status = CaronaRequestStatus.ACCEPTED;
  request.conversationId = connection.conversationId;
  write(store);

  sendLocalMessage(
    connection.conversationId,
    "me",
    `Carona Amiga confirmada\nDestino: ${offer.destination}\nHorário: ${offer.time}\nEncontro: ${offer.meetup}`,
    { id: ownerId, name: "Carona Amiga" },
  );
  return request;
}

export function rejectCaronaRequest(
  requestId: string,
  ownerId = getDemoIdentity().id,
): CaronaRequest | null {
  const store = read();
  const request = store.requests.find((item) => item.id === requestId);
  if (!request) return null;
  const offer = store.offers.find((item) => item.id === request.rideOfferId);
  if (!offer || offer.ownerId !== ownerId) return null;
  if (request.status !== CaronaRequestStatus.REQUESTED) return request;
  request.status = CaronaRequestStatus.REJECTED;
  write(store);
  return request;
}

export function cancelCaronaOffer(
  offerId: string,
  ownerId = getDemoIdentity().id,
): CaronaOffer | null {
  const store = read();
  const offer = store.offers.find((item) => item.id === offerId);
  if (!offer || offer.ownerId !== ownerId) return null;
  offer.status = CaronaOfferStatus.CANCELLED;
  for (const request of store.requests) {
    if (request.rideOfferId === offerId && request.status === CaronaRequestStatus.REQUESTED) {
      request.status = CaronaRequestStatus.CANCELLED;
    }
  }
  write(store);
  return offer;
}

export function cancelCaronaRequest(
  requestId: string,
  requesterId = getDemoIdentity().id,
): CaronaRequest | null {
  const store = read();
  const request = store.requests.find((item) => item.id === requestId);
  if (!request || request.requesterId !== requesterId) return null;
  const offer = store.offers.find((item) => item.id === request.rideOfferId);
  if (
    request.status === CaronaRequestStatus.ACCEPTED &&
    offer &&
    offer.status !== CaronaOfferStatus.CANCELLED
  ) {
    offer.availableSeats += 1;
    if (offer.status === CaronaOfferStatus.FULL) offer.status = CaronaOfferStatus.ACTIVE;
  }
  request.status = CaronaRequestStatus.CANCELLED;
  write(store);
  return request;
}
