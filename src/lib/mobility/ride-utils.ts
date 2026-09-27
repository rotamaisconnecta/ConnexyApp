/* =========================================================
   ride-utils.ts — General ride utility functions
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { GeoLocation } from "./ride-types";
import type { Trip } from "./trip/trip-types";

/* ─── formatDistance ─────────────────────────────────────── */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")}km`;
}

/* ─── formatDuration ─────────────────────────────────────── */

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/* ─── formatArrivalTime ──────────────────────────────────── */

export function formatArrivalTime(minutes: number): string {
  if (minutes <= 1) return "Chegando";
  return `Chega em ${minutes} min`;
}

/* ─── formatRideDate ─────────────────────────────────────── */

export function formatRideDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ─── formatRideDateTime ─────────────────────────────────── */

export function formatRideDateTime(date: Date): string {
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${formatRideDate(date)} · ${time}`;
}

/* ─── getTotalHistoryPrice ─────────────────────────────────
   Valor exibido = tariffa final (se confirmada) ou estimada
   no pedido. Sempre a partir da Trip concluída. */

export function getTotalHistoryPrice(history: Trip[]): number {
  return history
    .filter((item) => item.status === "conclusao")
    .reduce((sum, item) => sum + (item.finalFare ?? item.estimatedFare), 0);
}

/* ─── truncateAddress ────────────────────────────────────── */

export function truncateAddress(address: string, maxLength: number = 40): string {
  if (address.length <= maxLength) return address;
  return address.slice(0, maxLength - 1) + "…";
}

/* ─── buildRouteLabel ────────────────────────────────────── */

export function buildRouteLabel(origin: GeoLocation, destination: GeoLocation): string {
  return `${origin.label} → ${destination.label}`;
}

/* ─── getRelativeTime ────────────────────────────────────── */

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
}
