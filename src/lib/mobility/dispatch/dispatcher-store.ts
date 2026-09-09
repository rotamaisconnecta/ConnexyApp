/* =========================================================
   dispatcher-store.ts — LocalDispatcher (modo demo).
   Singleton em nível de módulo: coordena frota, ofertas e
   aceites/recusas. Compatível com useSyncExternalStore.
   NÃO importa o Trip store (recebe snapshot por parâmetro);
   quem informa o resultado à Trip é a camada externa
   (dispatcher.ts). Pure TS no núcleo de lógica.
========================================================= */

import { buildDemoFleet } from "./demo-fleet";
import type {
  DemoDriver,
  DispatchDriverStatus,
  DispatchEntry,
  DispatchEventRecord,
  DispatchEventType,
  DispatchMeta,
  DispatchRequest,
  DispatchSnapshot,
  DispatchTripSnapshot,
  RideDispatcher,
  RideOffer,
} from "./dispatch-types";
import type { TripDriver } from "../trip/trip-types";

/* ─── Estado interno ─────────────────────────────────────── */

let state: DispatchSnapshot = {
  fleet: buildDemoFleet(),
  entries: [],
  events: [],
};

const listeners = new Set<() => void>();
const eventListeners = new Set<(event: DispatchEventRecord) => void>();

/* ─── Helpers de estado imutável ─────────────────────────── */

function updateFleetStatus(driverId: string, status: DispatchDriverStatus): void {
  state = {
    ...state,
    fleet: state.fleet.map((driver) => (driver.id === driverId ? { ...driver, status } : driver)),
  };
  notify();
}

function touchEntry(tripId: string, mutate: (entry: DispatchEntry) => DispatchEntry): void {
  state = {
    ...state,
    entries: state.entries.map((entry) => (entry.tripId === tripId ? mutate(entry) : entry)),
  };
  notify();
}

function pushEvent(type: DispatchEventType, tripId: string, driverId?: string): void {
  const record: DispatchEventRecord = { type, tripId, driverId, at: new Date().toISOString() };
  state = { ...state, events: [...state.events, record].slice(-100) };
  eventListeners.forEach((listener) => listener(record));
  notify();
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  return Math.hypot(aLat - bLat, aLng - bLng) * 111320;
}

/* ─── Inscrição em eventos (formatação para o exterior) ──── */

export function onDispatchEvent(listener: (event: DispatchEventRecord) => void): () => void {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

/* ─── Leitura / inscrição (useSyncExternalStore) ─────────── */

export function getDispatchSnapshot(): DispatchSnapshot {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getFleet(): DemoDriver[] {
  return state.fleet;
}

export function getDriverById(driverId: string): DemoDriver | undefined {
  return state.fleet.find((driver) => driver.id === driverId);
}

export function getEntry(tripId: string): DispatchEntry | undefined {
  return state.entries.find((entry) => entry.tripId === tripId);
}

export function getOfferForDriver(driverId: string): RideOffer | null {
  const entry = state.entries.find(
    (item) =>
      item.status === "pending" && item.assigningDriverId === driverId && item.offer !== null,
  );
  return entry?.offer ?? null;
}

export function getAssignedDriver(tripId: string): DemoDriver | null {
  const entry = state.entries.find(
    (item) => item.tripId === tripId && item.assignedDriverId !== null,
  );
  if (!entry || !entry.assignedDriverId) return null;
  return getDriverById(entry.assignedDriverId) ?? null;
}

/** Corrida atualmente atribuída a um motorista (p/ tela do driver). */
export function getActiveAssignmentForDriver(driverId: string): DispatchEntry | undefined {
  return state.entries.find(
    (item) => item.status === "assigned" && item.assignedDriverId === driverId,
  );
}

/* ─── Conversão frota → TripDriver ───────────────────────── */

export function toTripDriver(driver: DemoDriver): TripDriver {
  return {
    id: driver.id,
    name: driver.name,
    rating: driver.rating,
    totalRides: driver.totalRides,
    photo: driver.photo,
    vehicle: { ...driver.vehicle },
    boardingCode: driver.boardingCode,
    verified: driver.verified,
  };
}

/* ─── Protocolo "voyager": único motorista demo deste app ── */

/** O driver demo deste dispositivo entra/sai de disponibilidade. */
export function setDriverStatus(driverId: string, status: DispatchDriverStatus): void {
  const current = getDriverById(driverId);
  if (!current || current.status === status) return;

  if (status === "offline") {
    if (current.status === "offering") {
      const entry = state.entries.find(
        (item) => item.status === "pending" && item.assigningDriverId === driverId,
      );
      if (entry) LocalDispatcher.declineOffer(entry.tripId, driverId);
    }
    updateFleetStatus(driverId, "offline");
    return;
  }

  if (status === "available") {
    /* Motorista em corrida não fica disponível manualmente. */
    if (
      current.status === "accepted" ||
      current.status === "busy" ||
      current.status === "offering"
    ) {
      return;
    }
    updateFleetStatus(driverId, "available");
  }
}

/* ─── Núcleo do dispatcher ───────────────────────────────── */

const LocalDispatcher: RideDispatcher = {
  requestRide(tripId, payload?) {
    if (!payload) return;
    if (state.entries.some((entry) => entry.tripId === tripId && entry.status !== "cancelled")) {
      return; /* idempotente: mesma Trip não gera segunda solicitação */
    }

    const entry: DispatchEntry = {
      tripId,
      status: "pending",
      assigningDriverId: null,
      offeredDriverIds: [],
      declinedDriverIds: [],
      assignedDriverId: null,
      offer: null,
      request: payload,
      requestedAt: new Date().toISOString(),
    };
    state = { ...state, entries: [...state.entries, entry] };
    pushEvent("RIDE_REQUESTED", tripId);
    offerToNext(tripId);
  },

  acceptOffer(tripId, driverId) {
    const entry = getEntry(tripId);
    /* Concorrência: uma Trip só pode ter UMA atribuição. */
    if (!entry || entry.status !== "pending") return false;
    if (entry.assignedDriverId !== null) return false;
    /* Apenas o motorista com a oferta ativa pode aceitar. */
    if (entry.assigningDriverId !== driverId) return false;

    const driver = getDriverById(driverId);
    if (!driver || driver.status !== "offering") return false;

    updateFleetStatus(driverId, "accepted");
    touchEntry(tripId, (current) => ({
      ...current,
      status: "assigned",
      assignedDriverId: driverId,
      assigningDriverId: null,
    }));
    pushEvent("DRIVER_ACCEPTED", tripId, driverId);
    pushEvent("DRIVER_ASSIGNED", tripId, driverId);
    return true;
  },

  declineOffer(tripId, driverId) {
    const entry = getEntry(tripId);
    if (!entry || entry.status !== "pending") return;
    if (entry.assigningDriverId !== driverId) return;

    const driver = getDriverById(driverId);
    if (driver && driver.status === "offering") {
      updateFleetStatus(driverId, "available");
    }
    touchEntry(tripId, (current) => ({
      ...current,
      assigningDriverId: null,
      offer: null,
      declinedDriverIds: [...current.declinedDriverIds, driverId],
    }));
    pushEvent("DRIVER_DECLINED", tripId, driverId);
    offerToNext(tripId); /* outro motorista elegível recebe a oferta */
  },

  cancelRequest(tripId) {
    const entry = getEntry(tripId);
    if (!entry || entry.status === "cancelled") return;

    if (entry.status === "pending" && entry.assigningDriverId) {
      const offered = getDriverById(entry.assigningDriverId);
      if (offered && offered.status === "offering") {
        updateFleetStatus(offered.id, "available");
      }
    }
    if (entry.status === "assigned" && entry.assignedDriverId) {
      const accepted = getDriverById(entry.assignedDriverId);
      if (accepted && (accepted.status === "accepted" || accepted.status === "busy")) {
        updateFleetStatus(accepted.id, "available");
      }
    }
    touchEntry(tripId, (current) => ({
      ...current,
      status: "cancelled",
      assigningDriverId: null,
      offer: null,
    }));
    pushEvent("RIDE_CANCELLED", tripId);
  },

  /* Desistência do motorista após ter aceitado. reoffer=true
     (pré-embarque) recoloca a corrida em busca; reoffer=false
     (durante a viagem) encerra a entrada do dispatcher. */
  cancelDriverAssignment(tripId, driverId, opts) {
    const entry = getEntry(tripId);
    if (!entry || entry.status !== "assigned") return;
    if (entry.assignedDriverId !== driverId) return;

    const driver = getDriverById(driverId);
    if (driver && (driver.status === "accepted" || driver.status === "busy")) {
      updateFleetStatus(driverId, "available");
    }

    const reoffer = opts?.reoffer ?? false;
    if (reoffer) {
      touchEntry(tripId, (current) => ({
        ...current,
        status: "pending",
        assignedDriverId: null,
        assigningDriverId: null,
        offer: null,
        declinedDriverIds: [...current.declinedDriverIds, driverId],
      }));
      pushEvent("DRIVER_CANCELLED", tripId, driverId);
      offerToNext(tripId); /* outro motorista elegível recebe a oferta */
    } else {
      touchEntry(tripId, (current) => ({
        ...current,
        status: "cancelled",
        assignedDriverId: null,
        assigningDriverId: null,
        offer: null,
      }));
      pushEvent("DRIVER_CANCELLED", tripId, driverId);
    }
  },
};

/* ─── Ofertar ao próximo motorista elegível ──────────────── */

function offerToNext(tripId: string): void {
  const entry = getEntry(tripId);
  if (!entry || entry.status !== "pending") return;
  if (entry.assignedDriverId !== null) return;
  const request = entry.request;
  if (!request) return;
  const destination = request.trip.destination;
  if (!destination) return;

  const origin = request.trip.origin;
  let next: DemoDriver | null = null;
  let best = Infinity;
  for (const driver of state.fleet) {
    if (driver.status !== "available") continue;
    if (entry.offeredDriverIds.includes(driver.id)) continue;
    if (entry.declinedDriverIds.includes(driver.id)) continue;
    const d = distanceMeters(origin.lat, origin.lng, driver.lat, driver.lng);
    if (d < best) {
      best = d;
      next = driver;
    }
  }
  if (!next) return; /* sem motoristas elegíveis: Trip segue "buscando" */

  const offer: RideOffer = {
    id: `offer-${tripId}-${next.id}-${Date.now()}`,
    tripId,
    driverId: next.id,
    passengerName: request.meta.passengerName,
    passengerPhoto: request.meta.passengerPhoto,
    passengerRating: request.meta.passengerRating,
    origin: origin.label,
    originLat: origin.lat,
    originLng: origin.lng,
    destination: destination.label,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    distanceMeters: request.trip.distanceMeters,
    durationMinutes: request.trip.durationMinutes,
    price: request.trip.estimatedFare,
    paymentMethod: request.trip.paymentMethod,
    category: request.trip.category,
    offeredAt: new Date().toISOString(),
  };

  updateFleetStatus(next.id, "offering");
  touchEntry(tripId, (current) => ({
    ...current,
    assigningDriverId: next.id,
    offeredDriverIds: [...current.offeredDriverIds, next.id],
    offer,
  }));
  pushEvent("DRIVER_OFFERED", tripId, next.id);
}

/* ─── Liberar motorista após fim da Trip (conclusao) ─────── */

export function releaseTripDrivers(tripId: string): void {
  const entry = getEntry(tripId);
  if (!entry) return;
  const driverId = entry.assignedDriverId ?? entry.assigningDriverId;
  if (!driverId) return;
  const driver = getDriverById(driverId);
  if (
    driver &&
    (driver.status === "accepted" || driver.status === "busy" || driver.status === "offering")
  ) {
    updateFleetStatus(driver.id, "available");
  }
}

/* ─── Reset de sessão (dev) ──────────────────────────────── */

export function resetDispatchState(): void {
  state = { fleet: buildDemoFleet(), entries: [], events: [] };
  notify();
}

/* ─── API pública (wrapper sobre o LocalDispatcher) ──────── */

export function requestRide(tripId: string, payload?: DispatchRequest): void {
  LocalDispatcher.requestRide(tripId, payload);
}

export function acceptOffer(tripId: string, driverId: string): boolean {
  return LocalDispatcher.acceptOffer(tripId, driverId);
}

export function declineOffer(tripId: string, driverId: string): void {
  LocalDispatcher.declineOffer(tripId, driverId);
}

export function cancelRequest(tripId: string): void {
  LocalDispatcher.cancelRequest(tripId);
}

export function cancelDriverAssignment(
  tripId: string,
  driverId: string,
  opts?: { reoffer?: boolean },
): void {
  LocalDispatcher.cancelDriverAssignment(tripId, driverId, opts);
}

export function dispatchApi(): RideDispatcher {
  return LocalDispatcher;
}

export function getDemoDriverById(driverId: string): DemoDriver {
  const driver = getDriverById(driverId);
  if (!driver) return getDriverById("marcos")!;
  return driver;
}
