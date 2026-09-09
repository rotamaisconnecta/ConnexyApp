import { useEffect, useSyncExternalStore } from "react";
import type { Trip, TripStatus } from "@/lib/mobility/trip/trip-types";
import {
  getActiveAssignmentForDriver,
  getDispatchSnapshot,
  getDriverById,
  getOfferForDriver,
  subscribe,
} from "@/lib/mobility/dispatch/dispatcher-store";
import type {
  DemoDriver,
  DispatchSnapshot,
  RideOffer,
} from "@/lib/mobility/dispatch/dispatch-types";
import { DEMO_DRIVER_ID } from "@/lib/mobility/dispatch/demo-fleet";
import { getTrip } from "@/lib/mobility/trip/trip-store";
import {
  acceptRideOffer,
  cancelDriverAssignment as cancelDriverAssignmentAction,
  declineRideOffer,
  requestPassengerRide,
  setDemoDriverOnline,
} from "@/lib/mobility/dispatch/dispatcher";

/* ─── Snapshot reativo do dispatcher ─────────────────────── */

export function useDispatchSnapshot(): DispatchSnapshot {
  return useSyncExternalStore(subscribe, getDispatchSnapshot);
}

/* ─── Motorista demo (frota) ─────────────────────────────── */

export function useDemoDriver(driverId: string = DEMO_DRIVER_ID): DemoDriver {
  const snapshot = useDispatchSnapshot();
  return snapshot.fleet.find((item) => item.id === driverId) ?? snapshot.fleet[0];
}

/** O motorista demo está "online" (recebendo ofertas). */
export function useDemoDriverOnline(driverId: string = DEMO_DRIVER_ID): boolean {
  const driver = useDemoDriver(driverId);
  return driver.status !== "offline";
}

/* ─── Oferta ativa para um motorista ─────────────────────── */

export function useOfferForDriver(driverId: string = DEMO_DRIVER_ID): RideOffer | null {
  useDispatchSnapshot();
  return getOfferForDriver(driverId);
}

/* ─── Ações do motorista demo ────────────────────────────── */

export function toggleDemoDriverOnline(driverId: string = DEMO_DRIVER_ID): void {
  const driver = getDriverById(driverId);
  setDemoDriverOnline(driverId, driver?.status === "offline");
}

export function acceptDemoDriverOffer(driverId: string = DEMO_DRIVER_ID): void {
  const offer = getOfferForDriver(driverId);
  if (offer) acceptRideOffer(offer.tripId, driverId);
}

export function declineDemoDriverOffer(driverId: string = DEMO_DRIVER_ID): void {
  const offer = getOfferForDriver(driverId);
  if (offer) declineRideOffer(offer.tripId, driverId);
}

/* ─── Atribuição ativa de um motorista (corrida aceita) ──── */

export function useDriverActiveAssignment(
  driverId: string = DEMO_DRIVER_ID,
): { tripId: string; tripStatus: TripStatus } | null {
  useDispatchSnapshot();
  const entry = getActiveAssignmentForDriver(driverId);
  const trip = getTrip();
  if (!entry) return null;
  if (!trip || trip.id !== entry.tripId) return null;
  if (trip.status === "conclusao" || trip.status === "cancelada") return null;
  return { tripId: entry.tripId, tripStatus: trip.status };
}

/** Motorista desiste da corrida já aceita (pré-embarque ou viagem). */
export function cancelDemoDriverAssignment(
  tripId: string,
  driverId: string = DEMO_DRIVER_ID,
): void {
  cancelDriverAssignmentAction(tripId, driverId);
}

/* ─── Dispatcher do lado do passageiro ─────────────────────
   Dispara o requestRide ao entrar em "buscando". Garante que
   o módulo dispatcher.ts é carregado (registra as inscrições
   que ligam o dispatcher ao Trip store). Idempotente. */

export function usePassengerDispatch(trip: Trip | null): void {
  useEffect(() => {
    if (trip && trip.status === "buscando") {
      requestPassengerRide(trip.id);
    }
  }, [trip]);
}
