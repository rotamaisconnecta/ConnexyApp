/* =========================================================
   demo-cast-rides.ts — Baixa automática do motorista demo.
   Não inventa status: só age em chegada/avaliacao, com as
   actions reais (confirmDriverPayment + completeTrip).
========================================================= */

import { tripPaymentStatus } from "@/lib/mobility/payment";
import { canTransition, isTerminal } from "@/lib/mobility/trip/trip-machine";
import {
  completeTrip,
  confirmDriverPayment,
  getHistorySnapshot,
  getTrip,
  transition,
} from "@/lib/mobility/trip/trip-store";
import type { Trip } from "@/lib/mobility/trip/trip-types";
import { getDemoDriverBehavior } from "./demo-cast";
import { isDemoMode } from "./demo-config";

const SETTLEMENT_STATUSES = new Set(["chegada", "avaliacao"]);

let settlementInFlight = false;

/** Dispatcher: só finaliza quando o comportamento demo pede auto-complete. */
export function maybeAutoCompleteDemoRide(): Trip | null {
  if (!isDemoMode() || !getDemoDriverBehavior().autoCompleteRide) return getTrip();
  return finalizeDemoCastRideAsPaid();
}

/**
 * Executa a baixa real a partir do estado atual.
 * No-op fora de chegada/avaliacao, fora do demo, ou se já terminal.
 */
export function finalizeDemoCastRideAsPaid(options?: { enabled?: boolean }): Trip | null {
  const enabled = options?.enabled ?? isDemoMode();
  if (!enabled) return getTrip();
  if (settlementInFlight) return getTrip();
  settlementInFlight = true;
  try {
    const current = getTrip();
    if (!current) return null;
    if (isTerminal(current.status)) return current;
    if (current.paymentIssue === "user_not_paid") return current;
    if (!SETTLEMENT_STATUSES.has(current.status)) return current;

    if (current.status === "chegada") {
      if (tripPaymentStatus(current) !== "paid") confirmDriverPayment();
      const afterPayment = getTrip();
      if (afterPayment && canTransition(afterPayment.status, "avaliacao")) {
        transition("avaliacao");
      }
    }

    const ready = getTrip();
    if (!ready) return null;
    if (isTerminal(ready.status)) return ready;
    if (ready.status !== "avaliacao") return ready;
    if (tripPaymentStatus(ready) !== "paid") confirmDriverPayment();
    return completeTrip() ?? getTrip();
  } finally {
    settlementInFlight = false;
  }
}

export function demoRideIsPaid(trip: Trip | null = getTrip()): boolean {
  if (!trip) return false;
  return tripPaymentStatus(trip) === "paid";
}

export function demoRideIsInHistory(tripId: string): boolean {
  return getHistorySnapshot().some((item) => item.id === tripId);
}
