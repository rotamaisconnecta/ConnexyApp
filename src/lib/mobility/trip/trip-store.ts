/* =========================================================
   trip-store.ts — Store central da Trip (modo demo).
   Singleton em nível de módulo: sobrevive à navegação entre
   telas (/ride/request, /ride/matching, /ride/active) e a
   reloads (persistência em localStorage).
   Compatível com useSyncExternalStore (React).
   Nenhuma biblioteca externa foi adicionada.
========================================================= */

import type { GeoLocation } from "../ride-types";
import type { RouteStop } from "../route-utils";
import { estimateRouteDistance, estimateRouteDuration } from "../route-utils";
import { canTransition, isCancellable, isTerminal } from "./trip-machine";
import type { Trip, TripDriver, TripRating, TripStatus } from "./trip-types";

const STORAGE_KEY = "connexy_demo_trip";

/* ─── Estado interno ─────────────────────────────────────── */

interface TripStoreState {
  trip: Trip | null;
  history: Trip[];
}

/* ─── Helpers ────────────────────────────────────────────── */

function createTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeRouteMeta(
  origin: GeoLocation,
  stops: RouteStop[],
  destination: GeoLocation | null,
): { distanceMeters: number; durationMinutes: number } {
  const points = [origin, ...stops.map((stop) => stop.location), destination ?? origin];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += estimateRouteDistance(points[i - 1], points[i]);
  }
  total = Math.max(400, Math.round(total));
  const duration = estimateRouteDuration(total) + stops.length * 3;
  return { distanceMeters: total, durationMinutes: duration };
}

/* ─── Persistência ───────────────────────────────────────── */

function loadState(): TripStoreState {
  if (typeof window === "undefined") return { trip: null, history: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { trip: null, history: [] };
    const parsed = JSON.parse(raw) as { trip?: Trip | null; history?: Trip[] };
    if (!parsed || typeof parsed !== "object") return { trip: null, history: [] };
    if (parsed.trip && typeof parsed.trip.status === "string") {
      return {
        trip: parsed.trip,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    }
    return { trip: null, history: Array.isArray(parsed.history) ? parsed.history : [] };
  } catch {
    return { trip: null, history: [] };
  }
}

let state: TripStoreState = loadState();

const listeners = new Set<() => void>();

function persistAndNotify(next: TripStoreState): void {
  state = next;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ trip: next.trip, history: next.history }),
      );
    }
  } catch {
    /* fallback silencioso (ex.: storage indisponível) */
  }
  listeners.forEach((listener) => listener());
}

/* ─── Leitura / inscrição (useSyncExternalStore) ─────────── */

export function getTrip(): Trip | null {
  return state.trip;
}

export function getTripSnapshot(): Trip | null {
  return state.trip;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ─── Criação da Trip ──────────────────────────────────────
   Cria UMA Trip para o fluxo. Se já existir uma Trip ativa/
   em planejamento, devolve a mesma (não duplica). Trips
   terminais (concluída/cancelada) são substituídas ao iniciar
   uma nova solicitação. */
export interface TripSeed {
  origin: GeoLocation;
  destination?: GeoLocation | null;
  stops?: RouteStop[];
  source?: string | null;
  companionLabel?: string;
}

export function createTrip(seed: TripSeed): Trip {
  const current = state.trip;
  if (current && !isTerminal(current.status)) return current;

  const destination = seed.destination ?? null;
  const stops = seed.stops ?? [];
  const routeMeta = computeRouteMeta(seed.origin, stops, destination);

  const trip: Trip = {
    id: createTripId(),
    status: destination ? "rota" : "solicitar",
    origin: seed.origin,
    destination,
    stops,
    pickupLabel: "Entrada principal",
    pickupPoint: "Entrada principal",
    category: "connexy",
    paymentMethod: "pix",
    driver: null,
    distanceMeters: routeMeta.distanceMeters,
    durationMinutes: routeMeta.durationMinutes,
    estimatedFare: 0,
    finalFare: null,
    paymentConfirmed: false,
    currentStopIndex: 0,
    rating: null,
    source: seed.source ?? null,
    companionLabel: seed.companionLabel,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
  };

  persistAndNotify({ trip, history: state.history });
  return trip;
}

/* ─── Transição controlada por status ────────────────────── */

export function transition(to: TripStatus, data?: Partial<Trip>): Trip | null {
  const current = state.trip;
  if (!current) return null;
  if (!canTransition(current.status, to)) return current;

  const now = new Date().toISOString();
  const next: Trip = {
    ...current,
    ...data,
    status: to,
    startedAt: to === "emviagem" ? (current.startedAt ?? now) : current.startedAt,
    completedAt: to === "conclusao" ? now : current.completedAt,
    cancelledAt: to === "cancelada" ? now : current.cancelledAt,
  };

  persistAndNotify({ ...state, trip: next });
  return next;
}

/* ─── Patch parcial (sem mudar status) ───────────────────── */

export function patchTrip(patch: Partial<Trip>): Trip | null {
  const current = state.trip;
  if (!current) return null;
  const next = { ...current, ...patch };
  persistAndNotify({ ...state, trip: next });
  return next;
}

/* ─── Motorista encontrado ───────────────────────────────── */

export function markDriverFound(driver: TripDriver): Trip | null {
  return transition("encontrado", { driver });
}

/* ─── Cancelamento centralizado ──────────────────────────── */

export function cancelTrip(): Trip | null {
  const current = state.trip;
  if (!current) return null;
  if (!isCancellable(current.status)) return current;
  return transition("cancelada", { cancelledBy: "passenger" });
}

/* ─── Conclusão centralizada ─────────────────────────────── */

export function completeTrip(rating?: TripRating): Trip | null {
  const current = state.trip;
  if (!current) return null;
  const next = current.status === "avaliacao" || current.status === "chegada" ? current : null;
  if (!next) return current;
  return transition("conclusao", {
    finalFare: current.finalFare ?? current.estimatedFare,
    rating: rating ?? current.rating,
  });
}

/* ─── Reset/limpeza ──────────────────────────────────────── */

export function resetTrip(): void {
  const current = state.trip;
  persistAndNotify({
    trip: null,
    history: current ? [...state.history, current] : state.history,
  });
}

export function clearTrip(): void {
  persistAndNotify({ trip: null, history: state.history });
}
