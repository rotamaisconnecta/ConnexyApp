/* =========================================================
   ride-blocks.ts — Inadimplência de corrida por usuário (demo).
   Fonte única e persistente para "este usuário está impedido
   de solicitar nova corrida?". Vínculo é por identidade demo
   (userId), NUNCA por paymentConfirmed=false de uma viagem em
   aberto nem por corridas canceladas.
   Estrutura única e tipada em connexy_demo_ride_blocks.
   Fase 6.4-C: bloqueio vale até regularização futura (não
   implementada). Idempotente: 1 pendência por viagem.
   Pure TypeScript + store reativo (useSyncExternalStore).
========================================================= */

import type { PaymentOption, Trip } from "./trip-types";

const STORAGE_KEY = "connexy_demo_ride_blocks";
const DEFAULT_STATE: RideBlockState = {};

/* ─── Estado ─────────────────────────────────────────────── */

function rideFare(trip: Trip): number | null {
  return trip.finalFare ?? (trip.estimatedFare > 0 ? trip.estimatedFare : null);
}

export interface RideBlockSummary {
  date: string;
  origin: string;
  destination: string | null;
  fare: number | null;
  paymentMethod: PaymentOption;
  category: string;
}

export interface RideBlock {
  tripId: string;
  userId: string;
  issue: "user_not_paid";
  blockedAt: string;
  paymentConfirmed: false;
  summary: RideBlockSummary;
}

export type RideBlockState = Record<string, RideBlock>;

/* ─── Persistência ───────────────────────────────────────── */

function loadState(): RideBlockState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as RideBlockState;
    if (!parsed || typeof parsed !== "object") return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: RideBlockState = loadState();

const listeners = new Set<() => void>();

function persistAndNotify(next: RideBlockState): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch (error) {
    console.warn("[mobility] falha ao persistir o bloqueio local.", error);
    throw new Error("Não foi possível salvar o bloqueio da corrida.");
  }
  state = next;
  listeners.forEach((listener) => listener());
}

/* ─── Leitura / inscrição ────────────────────────────────── */

export function getRideBlocksSnapshot(): RideBlockState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBlockForUser(userId: string): RideBlock | null {
  return state[userId] ?? null;
}

export function isRideBlocked(userId: string): boolean {
  return Boolean(state[userId]);
}

/* ─── Registro (idempotente) ───────────────────────────────
   Só registra quando a Trip já está marcada como não paga
   (paymentIssue = "user_not_paid") e paymentConfirmed = false.
   - Uma viagem só gera UM bloqueio (chave tripId único).
   - Um usuário mantém UMA pendência ativa (sem duplicação).
   - Canceladas e pagas nunca chegam aqui (guarda no caller). */

export function registerRideBlock(trip: Trip): void {
  if (!trip) return;
  if (trip.paymentConfirmed) return;
  if (trip.paymentIssue !== "user_not_paid") return;
  const userId = trip.userId;
  if (!userId) return;

  const alreadyForTrip = Object.values(state).some((block) => block.tripId === trip.id);
  if (alreadyForTrip) return;

  const block: RideBlock = {
    tripId: trip.id,
    userId,
    issue: "user_not_paid",
    blockedAt: new Date().toISOString(),
    paymentConfirmed: false,
    summary: {
      date: trip.completedAt ?? trip.createdAt,
      origin: trip.origin.label,
      destination: trip.destination?.label ?? null,
      fare: rideFare(trip),
      paymentMethod: trip.paymentMethod,
      category: trip.category,
    },
  };

  persistAndNotify({ ...state, [userId]: block });
}

/* ─── Desbloqueio (FUTURA regularização — sem UI nesta fase)
   Mantido para a arquitetura permitir "Pendência → Regularizar
   pagamento → Confirmação → Desbloqueio". NÃO é usado agora. */

export function clearRideBlock(userId: string): void {
  const next = { ...state };
  delete next[userId];
  persistAndNotify(next);
}
