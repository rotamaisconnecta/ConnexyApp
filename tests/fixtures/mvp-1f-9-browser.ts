import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import {
  acceptRideOffer,
  cancelDriverAssignment,
  hydrateDispatcherFromTrip,
  setDemoDispatcherConfig,
} from "../../src/lib/mobility/dispatch/dispatcher";
import {
  getDispatchSnapshot,
  getEntry,
  resetDispatchState,
} from "../../src/lib/mobility/dispatch/dispatcher-store";
import {
  clearTrip,
  createTrip,
  getHistorySnapshot,
  getTrip,
  patchTrip,
  transition,
} from "../../src/lib/mobility/trip/trip-store";
import type { PaymentOption } from "../../src/lib/mobility/trip/trip-types";

const origin = { lat: -23.55, lng: -46.64, label: "Origem 1F-9" };
const destination = { lat: -23.58, lng: -46.67, label: "Destino 1F-9" };
const nativeFetch = window.fetch.bind(window);
let networkCalls = 0;

window.fetch = (...args) => {
  networkCalls += 1;
  return nativeFetch(...args);
};

function requestCurrentTrip(paymentMethod: PaymentOption) {
  const trip = getTrip();
  if (!trip) throw new Error("Trip ausente");
  if (trip.status === "rota") transition("embarque");
  if (getTrip()?.status === "embarque") transition("categoria");
  patchTrip({
    paymentMethod,
    estimatedFare: 24.5,
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

function startCurrentTrip() {
  transition("chegando");
  transition("chegou");
  patchTrip({ currentStopIndex: 0 });
  transition("emviagem");
  return getTrip();
}

function snapshot() {
  const trip = getTrip();
  const dispatch = getDispatchSnapshot();
  const entry = trip ? getEntry(trip.id) : undefined;
  return {
    identity: getDemoIdentity(),
    trip,
    history: getHistorySnapshot(),
    entry: entry
      ? {
          status: entry.status,
          assignedDriverId: entry.assignedDriverId,
          assigningDriverId: entry.assigningDriverId,
        }
      : null,
    fleet: dispatch.fleet.map((driver) => ({ id: driver.id, status: driver.status })),
    storageKeys: Object.keys(localStorage).sort(),
    dispatcherConfig: localStorage.getItem("connexy_demo_dispatcher"),
    parallelKeys: {
      dispatch: localStorage.getItem("connexy:demo:dispatch"),
      dispatcherStore: localStorage.getItem("connexy_demo_dispatcher_store"),
    },
    networkCalls,
  };
}

const harness = {
  reset() {
    localStorage.clear();
    clearTrip();
    resetDispatchState();
    setDemoDispatcherConfig({ autoAccept: false, delayMs: 60_000 });
    setDemoIdentity("lucas");
    networkCalls = 0;
    return snapshot();
  },
  createScenario() {
    return createTrip({
      origin,
      destination,
      userId: getDemoIdentity().id,
    });
  },
  request(paymentMethod: PaymentOption) {
    return requestCurrentTrip(paymentMethod);
  },
  accept: acceptCurrentOffer,
  start: startCurrentTrip,
  forgetDispatcherMemory() {
    resetDispatchState();
    return snapshot();
  },
  hydrate() {
    hydrateDispatcherFromTrip();
    return snapshot();
  },
  cancelDriver() {
    const trip = getTrip();
    if (!trip?.driver) throw new Error("Motorista ausente");
    cancelDriverAssignment(trip.id, trip.driver.id);
    return snapshot();
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1f9Harness: typeof harness;
  }
}

window.__connexyMvp1f9Harness = harness;
