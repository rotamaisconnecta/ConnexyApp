import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import {
  acceptRideOffer,
  cancelDriverAssignment,
  cancelPassengerTrip,
  declineRideOffer,
  requestPassengerRide,
  setDemoDispatcherConfig,
} from "../../src/lib/mobility/dispatch/dispatcher";
import {
  getDispatchSnapshot,
  getEntry,
  resetDispatchState,
} from "../../src/lib/mobility/dispatch/dispatcher-store";
import { buildCompanionStops, type CompanionStopInput } from "../../src/lib/mobility/ride-search";
import {
  clearRideBlock,
  getRideBlocksSnapshot,
  isRideBlocked,
} from "../../src/lib/mobility/trip/ride-blocks";
import {
  clearTrip,
  completeTrip,
  confirmDriverPayment,
  createTrip,
  getHistorySnapshot,
  getTrip,
  patchTrip,
  recordUnpaidTrip,
  transition,
} from "../../src/lib/mobility/trip/trip-store";
import type { PaymentOption } from "../../src/lib/mobility/trip/trip-types";
import type { RouteStop } from "../../src/lib/mobility/route-utils";

const origin = { lat: -23.55, lng: -46.64, label: "Origem 1D-4" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino 1D-4" };
const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;

window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

function stops(count: number): RouteStop[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `stop-1d-4-${index + 1}`,
    location: {
      lat: -23.56 - index / 1000,
      lng: -46.65 - index / 1000,
      label: `Endereço da parada ${index + 1}`,
    },
    label: `Parada ${index + 1}`,
    order: index + 1,
  }));
}

function createScenario(stopCount: number, paymentMethod: PaymentOption, source?: string) {
  return createTrip({
    origin,
    destination,
    stops: stops(stopCount),
    source,
    userId: getDemoIdentity().id,
  });
}

function requestCurrentTrip(paymentMethod: PaymentOption) {
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  if (trip.status === "rota") transition("embarque");
  if (getTrip()?.status === "embarque") transition("categoria");
  patchTrip({
    paymentMethod,
    estimatedFare: 24.5 + (getTrip()?.stops.length ?? 0) * 3,
    distanceMeters: 5200,
    durationMinutes: 22,
  });
  transition("buscando");
  return getTrip();
}

function acceptCurrentOffer() {
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  const entry = getEntry(trip.id);
  if (!entry?.assigningDriverId) throw new Error("Oferta ausente");
  const driverId = entry.assigningDriverId;
  return { accepted: acceptRideOffer(trip.id, driverId), driverId, trip: getTrip() };
}

function declineCurrentOffer() {
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  const entry = getEntry(trip.id);
  if (!entry?.assigningDriverId) throw new Error("Oferta ausente");
  const driverId = entry.assigningDriverId;
  declineRideOffer(trip.id, driverId);
  return { driverId, entry: getEntry(trip.id) };
}

function startCurrentTrip() {
  transition("chegando");
  transition("chegou");
  patchTrip({ currentStopIndex: 0 });
  transition("emviagem");
  return getTrip();
}

function advanceCurrentTrip() {
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  if (trip.status === "emviagem") {
    transition(trip.currentStopIndex < trip.stops.length ? "parada" : "chegada");
  } else if (trip.status === "parada") {
    if (trip.currentStopIndex + 1 < trip.stops.length) {
      patchTrip({ currentStopIndex: trip.currentStopIndex + 1 });
      transition("emviagem");
    } else {
      patchTrip({ currentStopIndex: trip.stops.length });
      transition("chegada");
    }
  }
  return getTrip();
}

function finishCurrentTrip() {
  transition("avaliacao");
  return completeTrip({
    stars: 5,
    tags: ["seguro"],
    comment: "Fluxo local 1D-4",
    createdAt: new Date().toISOString(),
  });
}

function snapshot() {
  return {
    identity: getDemoIdentity(),
    trip: getTrip(),
    history: getHistorySnapshot(),
    blocks: getRideBlocksSnapshot(),
    dispatch: getDispatchSnapshot(),
    networkCalls,
    storageKeys: Object.keys(localStorage).sort(),
  };
}

window.__connexyMobilityHarness = {
  reset() {
    localStorage.clear();
    clearTrip();
    for (const userId of ["lucas", "beatriz", "rafael"]) clearRideBlock(userId);
    resetDispatchState();
    setDemoDispatcherConfig({ autoAccept: false, delayMs: 60_000 });
    setDemoIdentity("lucas");
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  createScenario,
  createTogether(companions: CompanionStopInput[]) {
    return createTrip({
      origin,
      destination,
      stops: buildCompanionStops(origin, companions),
      source: "invite",
      companionLabel: "Ir juntos",
      userId: getDemoIdentity().id,
    });
  },
  request(paymentMethod: PaymentOption) {
    return requestCurrentTrip(paymentMethod);
  },
  requestAgain() {
    const trip = getTrip();
    if (trip) requestPassengerRide(trip.id);
    return snapshot();
  },
  accept: acceptCurrentOffer,
  decline: declineCurrentOffer,
  start: startCurrentTrip,
  advance: advanceCurrentTrip,
  confirmPayment() {
    return confirmDriverPayment();
  },
  markUnpaid() {
    return recordUnpaidTrip();
  },
  finish: finishCurrentTrip,
  cancelPassenger() {
    cancelPassengerTrip();
    return getTrip();
  },
  cancelDriver() {
    const trip = getTrip();
    if (!trip?.driver) throw new Error("Motorista ausente");
    cancelDriverAssignment(trip.id, trip.driver.id);
    return getTrip();
  },
  attemptNewTrip() {
    try {
      return { trip: createScenario(0, "pix"), error: null };
    } catch (error) {
      return { trip: null, error: error instanceof Error ? error.message : String(error) };
    }
  },
  unblock(userId: string) {
    clearRideBlock(userId);
    return isRideBlocked(userId);
  },
  failNextTripWrite() {
    const before = getTrip();
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("falha simulada");
    };
    let error: string | null = null;
    try {
      patchTrip({ paymentMethod: before?.paymentMethod === "pix" ? "dinheiro" : "pix" });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
    return { before, after: getTrip(), error };
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMobilityHarness: {
      reset(): unknown;
      asIdentity(id: string): unknown;
      createScenario(stops: number, payment: PaymentOption, source?: string): unknown;
      createTogether(companions: CompanionStopInput[]): unknown;
      request(payment: PaymentOption): unknown;
      requestAgain(): unknown;
      accept(): unknown;
      decline(): unknown;
      start(): unknown;
      advance(): unknown;
      confirmPayment(): unknown;
      markUnpaid(): unknown;
      finish(): unknown;
      cancelPassenger(): unknown;
      cancelDriver(): unknown;
      attemptNewTrip(): unknown;
      unblock(userId: string): unknown;
      failNextTripWrite(): unknown;
      snapshot(): unknown;
    };
  }
}
