/* =========================================================
   dispatch-types.ts — Tipos do DISPATCHER do Connexy.
   Camada central que liga PASSAGEIRO ↔ MOTORISTA em modo demo.
   Arquitetada para futuramente ser substituída por um
   dispatcher real (Supabase Realtime) — ver interface
   RideDispatcher. Pure TypeScript. No React.
========================================================= */

import type { PaymentOption } from "../trip/trip-types";
import type { RideCategory } from "../demo-fare";

/* ─── Status operacional do motorista no dispatcher ────────
   Não duplica o DriverStatus do domínio driver (lib/driver,
   que refere fase da corrida). Aqui o status é de DISPATCH:
   quem pode ou não receber ofertas. */

export type DispatchDriverStatus = "offline" | "available" | "offering" | "accepted" | "busy";

export interface DemoVehicle {
  name: string;
  color: string;
  plate: string;
  seats: number;
}

/* ─── Motorista da frota demo ──────────────────────────────
   Contém tudo que a Trip precisa ao ser associado (compatível
   com TripDriver) + dados de dispatch (categoria, posição,
   status). */

export interface DemoDriver {
  id: string;
  name: string;
  photo: string;
  rating: number;
  totalRides: number;
  vehicle: DemoVehicle;
  boardingCode: string;
  verified: boolean;
  category: RideCategory;
  lat: number;
  lng: number;
  status: DispatchDriverStatus;
}

export type DispatchEventType =
  | "RIDE_REQUESTED"
  | "DRIVER_OFFERED"
  | "DRIVER_DECLINED"
  | "DRIVER_ACCEPTED"
  | "DRIVER_ASSIGNED"
  | "DRIVER_CANCELLED"
  | "RIDE_CANCELLED";

export interface DispatchEventRecord {
  type: DispatchEventType;
  tripId: string;
  driverId?: string;
  at: string;
}

/* ─── Oferta visível para o motorista ────────────────────── */

export interface RideOffer {
  id: string;
  tripId: string;
  driverId: string;
  passengerName: string;
  passengerPhoto: string;
  passengerRating: number;
  origin: string;
  originLat: number;
  originLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  distanceMeters: number;
  durationMinutes: number;
  price: number;
  paymentMethod: PaymentOption;
  category: RideCategory;
  offeredAt: string;
}

/* ─── Instruções de embarque / origem da posição ─────────── */

export interface DispatchTripPoint {
  label: string;
  lat: number;
  lng: number;
}

/* ─── Snapshot da Trip entregue ao dispatcher ──────────────
   Cópia imutável: o dispatcher não depende do Trip store. */

export interface DispatchTripSnapshot {
  origin: DispatchTripPoint;
  destination: DispatchTripPoint | null;
  distanceMeters: number;
  durationMinutes: number;
  estimatedFare: number;
  paymentMethod: PaymentOption;
  category: RideCategory;
}

/* ─── Metadados do passageiro (exibidos ao motorista) ────── */

export interface DispatchMeta {
  passengerName: string;
  passengerPhoto: string;
  passengerRating: number;
}

/* ─── Entrada de despacho por Trip ───────────────────────── */

export type OfferStatus = "pending" | "assigned" | "cancelled";

export interface DispatchEntry {
  tripId: string;
  status: OfferStatus;
  assigningDriverId: string | null;
  offeredDriverIds: string[];
  declinedDriverIds: string[];
  assignedDriverId: string | null;
  offer: RideOffer | null;
  request: DispatchRequest | null;
  requestedAt: string;
}

export interface DispatchSnapshot {
  fleet: DemoDriver[];
  entries: DispatchEntry[];
  events: DispatchEventRecord[];
}

/* ─── Contrato do dispatcher ───────────────────────────────
   Interface conceitual: hoje a implementação é local
   (LocalDispatcher). Futuramente um RealtimeDispatcher pode
   implementar o mesmo contrato sobre Supabase Realtime/Browser
   sem mudar as chamadas. */

export interface RideDispatcher {
  requestRide(tripId: string, payload?: DispatchRequest): void;
  acceptOffer(tripId: string, driverId: string): boolean;
  declineOffer(tripId: string, driverId: string): void;
  cancelRequest(tripId: string): void;
  cancelDriverAssignment(tripId: string, driverId: string, opts?: { reoffer?: boolean }): void;
}

export interface DispatchRequest {
  trip: DispatchTripSnapshot;
  meta: DispatchMeta;
}
