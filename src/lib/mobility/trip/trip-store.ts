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
import { computeTripRouteMeta, limitRouteStops } from "../route-utils";
import { canTransition, isCancellable, isPlanning, isTerminal } from "./trip-machine";
import type { Trip, TripDriver, TripRating, TripStatus } from "./trip-types";
import { isRideBlocked, registerRideBlock } from "./ride-blocks";
import { getDemoIdentity } from "@/lib/demo/demo-identity";

const STORAGE_KEY = "connexy_demo_trip";

const KNOWN_TRIP_STATUSES = new Set<TripStatus>([
  "solicitar",
  "rota",
  "embarque",
  "categoria",
  "buscando",
  "encontrado",
  "chegando",
  "chegou",
  "emviagem",
  "parada",
  "chegada",
  "avaliacao",
  "conclusao",
  "cancelada",
]);

/* Estados que dependem do motorista persistido para renderizar o fluxo. */
const DRIVER_DEPENDENT_STATUSES = new Set<TripStatus>([
  "encontrado",
  "chegando",
  "chegou",
  "emviagem",
  "parada",
  "chegada",
  "avaliacao",
]);

const DESTINATION_REQUIRED_STATUSES = new Set<TripStatus>([
  "rota",
  "embarque",
  "categoria",
  "buscando",
  ...DRIVER_DEPENDENT_STATUSES,
]);

/* ─── Sanitização da Trip persistida (recuperação pós-reload) ──
   Uma Trip carregada do localStorage só é preservada quando pode
   ser retomada: estados terminais ficam como estão; estados válidos
   e ativos são restaurados (os timers do RideFlow rearmam). Trips
   sem continuidade possível (status desconhecido, motorista ausente
   onde é obrigatório ou fluxo avançado sem destino)
   saem do slot ativo sem tocar no histórico — liberando nova
   solicitação em vez de travar o usuário ("trip presa"). */
export function sanitizeTrip(trip: Trip | null): Trip | null {
  if (!trip || typeof trip !== "object") return null;
  if (typeof trip.status !== "string") return null;
  const status = trip.status as TripStatus;
  if (!KNOWN_TRIP_STATUSES.has(status)) return null;
  if (isTerminal(status)) return trip;
  if (!trip.id || !trip.origin || typeof trip.origin.label !== "string") return null;
  if (DESTINATION_REQUIRED_STATUSES.has(status) && !trip.destination) return null;
  if (DRIVER_DEPENDENT_STATUSES.has(status) && !trip.driver) return null;
  return trip;
}

/* ─── Estado interno ─────────────────────────────────────── */

export interface TripStoreState {
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
  const meta = computeTripRouteMeta(origin, stops, destination);
  if (meta.ok) return { distanceMeters: meta.distanceMeters, durationMinutes: meta.durationMinutes };
  return { distanceMeters: 400, durationMinutes: 3 };
}

/* ─── Persistência ───────────────────────────────────────── */

function loadState(): TripStoreState {
  if (typeof window === "undefined") return { trip: null, history: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { trip: null, history: [] };
    const parsed: unknown = JSON.parse(raw);
    const recovered = recoverPersistedTripState(parsed);
    if (
      parsed &&
      typeof parsed === "object" &&
      "trip" in parsed &&
      parsed.trip &&
      recovered.trip === null
    ) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recovered));
    }
    return recovered;
  } catch {
    return { trip: null, history: [] };
  }
}

export function recoverPersistedTripState(value: unknown): TripStoreState {
  if (!value || typeof value !== "object") return { trip: null, history: [] };
  const parsed = value as { trip?: unknown; history?: unknown };
  const history = Array.isArray(parsed.history) ? (parsed.history as Trip[]) : [];
  const candidate =
    parsed.trip && typeof parsed.trip === "object" && "status" in parsed.trip
      ? (parsed.trip as Trip)
      : null;
  return { trip: sanitizeTrip(candidate), history };
}

let state: TripStoreState = loadState();

const listeners = new Set<() => void>();

function persistAndNotify(next: TripStoreState): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ trip: next.trip, history: next.history }),
      );
    }
  } catch (error) {
    console.warn("[mobility] falha ao persistir a Trip local.", error);
    throw new Error("Não foi possível salvar o estado da corrida.");
  }
  state = next;
  listeners.forEach((listener) => listener());
}

function archiveTerminalTrip(history: Trip[], trip: Trip | null): Trip[] {
  if (!trip || !isTerminal(trip.status)) return history;
  const existingIndex = history.findIndex((item) => item.id === trip.id);
  if (existingIndex < 0) return [...history, trip];
  return history.map((item, index) => (index === existingIndex ? trip : item));
}

/* ─── Leitura / inscrição (useSyncExternalStore) ─────────── */

export function getTrip(): Trip | null {
  return state.trip;
}

export function getTripSnapshot(): Trip | null {
  return state.trip;
}

/* Histórico: fonte única = a própria Trip concluída/cancelada,
   armazenada no MESMO connexy_demo_trip (não cria chave nova).
   A Trip preserva finalFare, paymentMethod, paymentConfirmed,
   createdAt/completedAt/cancelledAt, origem/destino e driver. */
export function getHistorySnapshot(): Trip[] {
  return state.history;
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
  userId?: string;
}

export function createTrip(seed: TripSeed): Trip {
  const current = state.trip;
  const userId = seed.userId ?? getDemoIdentity().id;
  if (current && !isTerminal(current.status)) {
    if (current.userId && current.userId !== userId) {
      throw new Error("Existe uma corrida ativa para outra identidade.");
    }
    return current;
  }
  if (isRideBlocked(userId)) {
    throw new Error("Usuário bloqueado por uma corrida não paga.");
  }
  const destination = seed.destination ?? null;
  const stops = limitRouteStops(seed.stops ?? []);
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
    userId,
    currentStopIndex: 0,
    rating: null,
    source: seed.source ?? null,
    companionLabel: seed.companionLabel,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
  };

  persistAndNotify({ trip, history: archiveTerminalTrip(state.history, current) });
  return trip;
}

/** Inicia a corrida ou atualiza origem/destino enquanto ainda está no planejamento. */
export function startOrUpdatePlanningTrip(seed: TripSeed): Trip {
  const current = state.trip;
  if (current && isPlanning(current.status)) {
    const destination = seed.destination ?? current.destination;
    const stops =
      seed.stops && seed.stops.length > 0 ? limitRouteStops(seed.stops) : current.stops;
    const origin = current.origin;
    const routeMeta = computeRouteMeta(origin, stops, destination);
    return (
      patchTrip({
        origin,
        destination,
        stops,
        source: seed.source ?? current.source,
        companionLabel: seed.companionLabel ?? current.companionLabel,
        distanceMeters: routeMeta.distanceMeters,
        durationMinutes: routeMeta.durationMinutes,
      }) ?? current
    );
  }
  return createTrip(seed);
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

  persistAndNotify({
    trip: next,
    history: isTerminal(next.status) ? archiveTerminalTrip(state.history, next) : state.history,
  });
  return next;
}

/* ─── Patch parcial (sem mudar status) ───────────────────── */

export function patchTrip(patch: Partial<Trip>): Trip | null {
  const current = state.trip;
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    ...(patch.stops ? { stops: limitRouteStops(patch.stops) } : {}),
  };
  const routeChanged =
    Boolean(patch.origin) || patch.destination !== undefined || Boolean(patch.stops);
  if (routeChanged && patch.distanceMeters === undefined) {
    const routeMeta = computeRouteMeta(next.origin, next.stops, next.destination);
    next.distanceMeters = routeMeta.distanceMeters;
    next.durationMinutes = routeMeta.durationMinutes;
  }
  persistAndNotify({ ...state, trip: next });
  return next;
}

/* ─── Motorista encontrado ───────────────────────────────── */

export function markDriverFound(driver: TripDriver, extras?: Partial<Trip>): Trip | null {
  return transition("encontrado", { driver, ...extras });
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
  if (current.status !== "avaliacao") return current;
  if (!current.paymentConfirmed && current.paymentIssue !== "user_not_paid") return current;
  return transition("conclusao", {
    finalFare: current.finalFare ?? current.estimatedFare,
    rating: rating ?? current.rating,
  });
}

/* ─── Confirmação de pagamento (ação do MOTORISTA) ─────────
   Idempotente. Nunca roda em corrida registrada como não paga
   (invariante: paymentConfirmed=true e user_not_paid → inválido)
   e nunca roda depois da conclusão/cancelamento. */

export function confirmDriverPayment(): Trip | null {
  const current = state.trip;
  if (!current) return null;
  if (isTerminal(current.status)) return current;
  if (current.paymentIssue === "user_not_paid") return current;
  if (current.paymentConfirmed) return current;
  const next = { ...current, paymentConfirmed: true, paymentIssue: undefined };
  persistAndNotify({ ...state, trip: next });
  return next;
}

/* ─── Usuário não pagou (ação explícita do MOTORISTA) ───────
   Precisa confirmação na UI antes de chamar. Registra na Trip
   e cria o bloqueio do passageiro (idempotente). Corridas
   canceladas e pagas NUNCA caem aqui. */

export function recordUnpaidTrip(): Trip | null {
  const current = state.trip;
  if (!current) return null;
  if (isTerminal(current.status)) return current;
  if (current.paymentConfirmed) return current;
  if (current.status === "cancelada") return current;
  if (current.paymentIssue === "user_not_paid") {
    registerRideBlock(current);
    return current;
  }
  const next = { ...current, paymentConfirmed: false, paymentIssue: "user_not_paid" as const };
  persistAndNotify({ ...state, trip: next });
  registerRideBlock(next);
  return next;
}

/* ─── Reset/limpeza ──────────────────────────────────────── */

export function resetTrip(): void {
  const current = state.trip;
  persistAndNotify({
    trip: null,
    history: archiveTerminalTrip(state.history, current),
  });
}

export function clearTrip(): void {
  persistAndNotify({ trip: null, history: state.history });
}
