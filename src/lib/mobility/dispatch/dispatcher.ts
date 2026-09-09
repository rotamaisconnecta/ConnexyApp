/* =========================================================
   dispatcher.ts — Integração externa do dispatcher (demo).
   Liga o LocalDispatcher ao Trip store e implementa a
   política DEMO de aceite automático (fallback). Também
   observa o Trip store para: despachar ao entrar em
   "buscando", cancelar ofertas ao cancelar, e liberar o
   motorista ao concluir.
   É a camada que futuramente apontará para um
   RealtimeDispatcher sem mudar as chamadas do app.
========================================================= */

import {
  acceptOffer,
  cancelDriverAssignment as cancelDriverAssignmentStore,
  cancelRequest,
  declineOffer,
  getAssignedDriver,
  getEntry,
  onDispatchEvent,
  releaseTripDrivers,
  requestRide,
  setDriverStatus,
  toTripDriver,
} from "./dispatcher-store";
import type { DispatchMeta, DispatchRequest } from "./dispatch-types";
import { currentUser } from "@/lib/mock-data";
import {
  cancelTrip,
  getTrip,
  markDriverFound,
  subscribe as subscribeTrip,
  transition,
} from "../trip/trip-store";
import type { Trip } from "../trip/trip-types";

/* ─── Configuração da política demo ──────────────────────── */

const CONFIG_KEY = "connexy_demo_dispatcher";

interface DemoDispatcherConfig {
  autoAccept: boolean;
  delayMs: number;
}

const DEFAULT_CONFIG: DemoDispatcherConfig = { autoAccept: true, delayMs: 2600 };

function readConfig(): DemoDispatcherConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<DemoDispatcherConfig>;
    return {
      autoAccept: parsed.autoAccept ?? DEFAULT_CONFIG.autoAccept,
      delayMs: parsed.delayMs ?? DEFAULT_CONFIG.delayMs,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setDemoDispatcherConfig(partial: Partial<DemoDispatcherConfig>): void {
  const next = { ...readConfig(), ...partial };
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    }
  } catch {
    /* armazenamento indisponível: ignora */
  }
}

/* ─── Timer por oferta (policy demo de aceite) ───────────── */

const demoTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearDemoTimer(tripId: string): void {
  const timer = demoTimers.get(tripId);
  if (timer) {
    clearTimeout(timer);
    demoTimers.delete(tripId);
  }
}

function armAutoAccept(tripId: string): void {
  clearDemoTimer(tripId);
  const config = readConfig();
  if (!config.autoAccept) return;
  const timer = setTimeout(() => {
    demoTimers.delete(tripId);
    const entry = getEntry(tripId);
    if (entry && entry.status === "pending" && entry.assigningDriverId) {
      acceptOffer(tripId, entry.assigningDriverId);
    }
  }, config.delayMs);
  demoTimers.set(tripId, timer);
}

/* ─── Snapshot da Trip entregue ao dispatcher ────────────── */

function buildDispatchRequest(trip: Trip): DispatchRequest {
  const meta: DispatchMeta = {
    passengerName: currentUser.name,
    passengerPhoto: currentUser.photo,
    passengerRating: 4.9,
  };
  return {
    trip: {
      origin: {
        label: trip.origin.label ?? "Sua localização",
        lat: trip.origin.lat,
        lng: trip.origin.lng,
      },
      destination: trip.destination
        ? {
            label: trip.destination.label ?? "Destino",
            lat: trip.destination.lat,
            lng: trip.destination.lng,
          }
        : null,
      distanceMeters: trip.distanceMeters,
      durationMinutes: trip.durationMinutes,
      estimatedFare: trip.estimatedFare,
      paymentMethod: trip.paymentMethod,
      category: trip.category,
    },
    meta,
  };
}

/* ─── Inscrição nos eventos do dispatcher ────────────────── */

onDispatchEvent((event) => {
  switch (event.type) {
    case "DRIVER_OFFERED":
      armAutoAccept(event.tripId);
      break;
    case "DRIVER_ACCEPTED":
    case "DRIVER_DECLINED":
    case "DRIVER_CANCELLED":
    case "RIDE_CANCELLED":
      clearDemoTimer(event.tripId);
      break;
    case "DRIVER_ASSIGNED": {
      clearDemoTimer(event.tripId);
      const driver = getAssignedDriver(event.tripId);
      const trip = getTrip();
      if (driver && trip && trip.id === event.tripId && trip.status === "buscando") {
        markDriverFound(toTripDriver(driver));
      }
      break;
    }
    default:
      break;
  }
});

/* ─── Observação do Trip store ─────────────────────────────
   A Trip entra em "buscando" → dispatcher recebe a solicitação.
   Cancelada → solicitação é removida do dispatcher.
   Concluída → motorista é liberado para novas ofertas. */

subscribeTrip(() => {
  const trip = getTrip();
  if (!trip) return;
  switch (trip.status) {
    case "buscando":
      requestRide(trip.id, buildDispatchRequest(trip));
      break;
    case "cancelada":
      cancelRequest(trip.id);
      break;
    case "conclusao":
      releaseTripDrivers(trip.id);
      break;
    default:
      break;
  }
});

/* ─── Recuperar Trip em busca após reload ────────────────── */

(function init(): void {
  const trip = getTrip();
  if (trip && trip.status === "buscando") {
    requestRide(trip.id, buildDispatchRequest(trip));
  }
})();

/* ─── API para o app ───────────────────────────────────────
   Hoje delegam ao LocalDispatcher; amanhã podem apontar para
   um dispatch real (RealtimeDispatcher). */

export function requestPassengerRide(tripId: string): void {
  const trip = getTrip();
  if (!trip || trip.id !== tripId) return;
  requestRide(tripId, buildDispatchRequest(trip));
}

export function cancelPassengerRide(tripId: string): void {
  cancelRequest(tripId);
}

export function acceptRideOffer(tripId: string, driverId: string): boolean {
  return acceptOffer(tripId, driverId);
}

export function declineRideOffer(tripId: string, driverId: string): void {
  declineOffer(tripId, driverId);
}

/** Motorista demo disponível manualmente (via tela /driver). */
export function setDemoDriverOnline(driverId: string, online: boolean): void {
  setDriverStatus(driverId, online ? "available" : "offline");
}

/* ─── Cancelamento da mobilidade (FASE 6.3) ────────────────
   Semântica separada por autor:
   - Passageiro: cancelPassengerTrip() — cancela a própria viagem.
   - Motorista:  cancelDriverAssignment() — desiste da participação
     após aceitar (pré-embarque re-oferta; em viagem encerra a Trip). */

/** Passageiro cancela a própria viagem (só em estados canceláveis). */
export function cancelPassengerTrip(): void {
  cancelTrip();
}

/** Motorista desiste da participação após ter aceitado a corrida. */
export function cancelDriverAssignment(tripId: string, driverId: string): void {
  const trip = getTrip();
  const status = trip?.id === tripId ? trip.status : null;
  /* Pré-embarque: reabre a busca com re-oferta a outro motorista. */
  const reassignable = status === "encontrado" || status === "chegando" || status === "chegou";
  /* Em viagem/parada: não há resgate na demo — a Trip é encerrada. */
  const dumpsMidTrip = status === "emviagem" || status === "parada";

  cancelDriverAssignmentStore(tripId, driverId, { reoffer: reassignable });

  if (status && trip) {
    if (reassignable) {
      transition("buscando", { driver: null, cancelledBy: "driver" });
    } else if (dumpsMidTrip) {
      transition("cancelada", { driver: null, cancelledBy: "driver" });
    }
  }
}
