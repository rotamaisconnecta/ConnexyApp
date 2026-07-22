/* =========================================================
   ride-status.ts — Ride status management and transitions
   Pure TypeScript. No React. No side effects.
========================================================= */

import { RIDE_STATUS, type RideStatusValue } from "./ride-types";

/* ─── canTransition ──────────────────────────────────────── */

const VALID_TRANSITIONS: Record<RideStatusValue, RideStatusValue[]> = {
  [RIDE_STATUS.IDLE]: [RIDE_STATUS.REQUESTING],
  [RIDE_STATUS.REQUESTING]: [RIDE_STATUS.MATCHING, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.MATCHING]: [RIDE_STATUS.DRIVER_EN_ROUTE, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.DRIVER_EN_ROUTE]: [RIDE_STATUS.ARRIVED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.ARRIVED]: [RIDE_STATUS.IN_PROGRESS, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.IN_PROGRESS]: [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.COMPLETED]: [],
  [RIDE_STATUS.CANCELLED]: [],
};

export function canTransition(from: RideStatusValue, to: RideStatusValue): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/* ─── getStatusLabel ─────────────────────────────────────── */

export function getStatusLabel(status: RideStatusValue): string {
  switch (status) {
    case RIDE_STATUS.IDLE:
      return "Pronto";
    case RIDE_STATUS.REQUESTING:
      return "Solicitando…";
    case RIDE_STATUS.MATCHING:
      return "Buscando motorista…";
    case RIDE_STATUS.DRIVER_EN_ROUTE:
      return "Motorista a caminho";
    case RIDE_STATUS.ARRIVED:
      return "Motorista chegou";
    case RIDE_STATUS.IN_PROGRESS:
      return "Em viagem";
    case RIDE_STATUS.COMPLETED:
      return "Concluída";
    case RIDE_STATUS.CANCELLED:
      return "Cancelada";
    default:
      return "";
  }
}

/* ─── getStatusColor ─────────────────────────────────────── */

export function getStatusColor(status: RideStatusValue): string {
  switch (status) {
    case RIDE_STATUS.IDLE:
      return "text-muted-foreground";
    case RIDE_STATUS.REQUESTING:
    case RIDE_STATUS.MATCHING:
      return "text-primary";
    case RIDE_STATUS.DRIVER_EN_ROUTE:
      return "text-amber-500";
    case RIDE_STATUS.ARRIVED:
      return "text-success";
    case RIDE_STATUS.IN_PROGRESS:
      return "text-primary";
    case RIDE_STATUS.COMPLETED:
      return "text-success";
    case RIDE_STATUS.CANCELLED:
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

/* ─── getStatusBgColor ───────────────────────────────────── */

export function getStatusBgColor(status: RideStatusValue): string {
  switch (status) {
    case RIDE_STATUS.REQUESTING:
    case RIDE_STATUS.MATCHING:
      return "bg-primary/15 text-primary";
    case RIDE_STATUS.DRIVER_EN_ROUTE:
      return "bg-amber-500/15 text-amber-600";
    case RIDE_STATUS.ARRIVED:
      return "bg-success/15 text-success";
    case RIDE_STATUS.IN_PROGRESS:
      return "bg-primary/15 text-primary";
    case RIDE_STATUS.COMPLETED:
      return "bg-success/15 text-success";
    case RIDE_STATUS.CANCELLED:
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

/* ─── isActive ───────────────────────────────────────────── */

export function isActive(status: RideStatusValue): boolean {
  return (
    status === RIDE_STATUS.REQUESTING ||
    status === RIDE_STATUS.MATCHING ||
    status === RIDE_STATUS.DRIVER_EN_ROUTE ||
    status === RIDE_STATUS.ARRIVED ||
    status === RIDE_STATUS.IN_PROGRESS
  );
}

/* ─── canCancel ──────────────────────────────────────────── */

export function canCancel(status: RideStatusValue): boolean {
  return (
    status === RIDE_STATUS.REQUESTING ||
    status === RIDE_STATUS.MATCHING ||
    status === RIDE_STATUS.DRIVER_EN_ROUTE
  );
}

/* ─── canRate ────────────────────────────────────────────── */

export function canRate(status: RideStatusValue): boolean {
  return status === RIDE_STATUS.COMPLETED;
}

/* ─── canShare ───────────────────────────────────────────── */

export function canShare(status: RideStatusValue): boolean {
  return (
    status === RIDE_STATUS.DRIVER_EN_ROUTE ||
    status === RIDE_STATUS.ARRIVED ||
    status === RIDE_STATUS.IN_PROGRESS
  );
}

/* ─── getProgressPercent ─────────────────────────────────── */

export function getProgressPercent(status: RideStatusValue): number {
  switch (status) {
    case RIDE_STATUS.IDLE:
      return 0;
    case RIDE_STATUS.REQUESTING:
      return 10;
    case RIDE_STATUS.MATCHING:
      return 20;
    case RIDE_STATUS.DRIVER_EN_ROUTE:
      return 40;
    case RIDE_STATUS.ARRIVED:
      return 60;
    case RIDE_STATUS.IN_PROGRESS:
      return 80;
    case RIDE_STATUS.COMPLETED:
      return 100;
    case RIDE_STATUS.CANCELLED:
      return 0;
    default:
      return 0;
  }
}
