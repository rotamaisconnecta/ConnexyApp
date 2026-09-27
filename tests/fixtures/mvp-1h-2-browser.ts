import { getDemoIdentity, setDemoIdentity } from "../../src/lib/demo/demo-identity";
import { enterDemoSession } from "../../src/lib/demo/demo-auth";
import { getConnectionBetween } from "../../src/lib/demo/demo-db";
import { MORE_MENU_LABELS } from "../../src/lib/navigation/more-menu";
import {
  listConnectPulseItems,
  listHomeDiscoveryItems,
  NEARBY_PAGE_SIZE,
  paginateNearby,
} from "../../src/lib/home/home-discovery";
import {
  cancelReservation,
  createReservation,
  listReservations,
  ReservationResourceType,
} from "../../src/lib/reservations/reservation-store";
import {
  acceptCaronaRequest,
  createCaronaOffer,
  getCaronaOffer,
  listDiscoverableCaronaOffers,
  requestCarona,
} from "../../src/lib/carona/carona-store";
import { getAllBusinesses } from "../../src/lib/marketplace/mock-businesses";
import { isBusinessReservable } from "../../src/lib/reservations/reservable";
import { REELS_DB_NAME } from "../../src/lib/persistence/domain/reels-schema";

const originalFetch = window.fetch.bind(window);
let networkCalls = 0;
window.fetch = (...args) => {
  networkCalls += 1;
  return originalFetch(...args);
};

function snapshot() {
  const identity = getDemoIdentity();
  const nearby = listHomeDiscoveryItems();
  const pulse = listConnectPulseItems();
  return {
    identity,
    moreMenu: [...MORE_MENU_LABELS],
    pulseKinds: [...new Set(pulse.map((item) => item.kind))],
    pulseCount: pulse.length,
    nearbyTotal: nearby.length,
    nearbyFirst: paginateNearby(nearby, NEARBY_PAGE_SIZE).length,
    nearbySecond: paginateNearby(nearby, NEARBY_PAGE_SIZE * 2).length,
    nearbyIds: paginateNearby(nearby, NEARBY_PAGE_SIZE * 2).map((item) => item.id),
    reservationsA: listReservations("lucas").map((item) => ({
      id: item.id,
      status: item.status,
      userId: item.userId,
    })),
    reservationsB: listReservations("beatriz").map((item) => item.id),
    offers: listDiscoverableCaronaOffers(identity.id).map((item) => item.id),
    reelsDb: REELS_DB_NAME,
    parallel: {
      pulse: window.localStorage.getItem("connexy:demo:pulse"),
      agora: window.localStorage.getItem("connexy-agora-data-local-db"),
      restaurant: window.localStorage.getItem("connexy:demo:restaurant-reservations"),
    },
    networkCalls,
  };
}

const harness = {
  reset() {
    localStorage.clear();
    setDemoIdentity("lucas");
    enterDemoSession();
    networkCalls = 0;
    return snapshot();
  },
  asIdentity(id: string) {
    setDemoIdentity(id);
    return getDemoIdentity();
  },
  reserve() {
    const business = getAllBusinesses().find(isBusinessReservable);
    if (!business) throw new Error("negócio reservável ausente");
    return createReservation({
      resourceId: business.id,
      resourceType: ReservationResourceType.BUSINESS,
      resourceName: business.name,
      date: "2026-09-24",
      time: "19:30",
      partySize: 2,
    });
  },
  cancel(id: string) {
    return cancelReservation(id);
  },
  publishRide() {
    return createCaronaOffer({
      origin: "Av. Paulista",
      destination: "Ibirapuera",
      meetup: "Metrô Trianon",
      date: "2026-09-24",
      time: "19:30",
      availableSeats: 2,
    });
  },
  requestRide(offerId: string) {
    return requestCarona(offerId);
  },
  acceptRide(requestId: string) {
    return acceptCaronaRequest(requestId);
  },
  offer(id: string) {
    return getCaronaOffer(id);
  },
  connection(a: string, b: string) {
    return getConnectionBetween(a, b);
  },
  snapshot,
};

declare global {
  interface Window {
    __connexyMvp1h2Harness: typeof harness;
  }
}

window.__connexyMvp1h2Harness = harness;
