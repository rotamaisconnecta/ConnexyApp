/* =========================================================
   trip-types.ts — Domínio central da viagem (Connexy).
   Fonte única de verdade para o estado de uma Trip no fluxo
   de mobilidade demo. Reutiliza tipos existentes do módulo
   (GeoLocation, RouteStop, RideCategory) sem duplicá-los.
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { GeoLocation } from "../ride-types";
import type { RouteStop } from "../route-utils";
import type { RideCategory } from "../demo-fare";

/* ─── Forma de pagamento (demo) ─────────────────────────── */

export type PaymentOption = "pix" | "dinheiro";

/* ─── Estados da viagem ────────────────────────────────────
   Nomenclatura coerente com o fluxo existente (RideFlow).
   Equivalências com o modelo conceitual:
   - solicitar/rota  → planning
   - embarque        → boarding
   - categoria       → category_selection
   - buscando        → searching
   - encontrado      → driver_found
   - chegando        → driver_arriving
   - chegou          → driver_arrived
   - emviagem        → in_trip
   - parada          → stop
   - chegada         → destination_reached / payment
   - avaliacao       → rating
   - conclusao       → completed
   - cancelada       → cancelled
----------------------------------------------------------- */

export type TripStatus =
  | "solicitar"
  | "rota"
  | "embarque"
  | "categoria"
  | "buscando"
  | "encontrado"
  | "chegando"
  | "chegou"
  | "emviagem"
  | "parada"
  | "chegada"
  | "avaliacao"
  | "conclusao"
  | "cancelada";

/* ─── Motorista da viagem ──────────────────────────────────
   Estrutura compatível com o MOCK_DRIVER atual (ride-data),
   preparada para futuramente receber um motorista real do
   backend (Fase 6.2). */
export interface TripDriver {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  photo: string;
  vehicle: {
    name: string;
    color: string;
    plate: string;
    seats: number;
  };
  boardingCode: string;
  verified: boolean;
}

/* ─── Avaliação pós-viagem ───────────────────────────────── */

export interface TripRating {
  stars: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

/* ─── Modelo central da viagem ───────────────────────────── */

export interface Trip {
  id: string;
  status: TripStatus;
  origin: GeoLocation;
  destination: GeoLocation | null;
  stops: RouteStop[];
  pickupLabel: string;
  pickupPoint: string;
  category: RideCategory;
  paymentMethod: PaymentOption;
  driver: TripDriver | null;
  distanceMeters: number;
  durationMinutes: number;
  estimatedFare: number;
  finalFare: number | null;
  paymentConfirmed: boolean;
  currentStopIndex: number;
  rating: TripRating | null;
  source?: string | null;
  companionLabel?: string;
  cancelledBy?: "passenger" | "driver";
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}
