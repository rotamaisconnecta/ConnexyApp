/* =========================================================
   trip-machine.ts — Máquina de estados central da Trip.
   Todas as transições de status passam por esta camada.
   Nenhuma tela altera trip.status diretamente.
   Pure TypeScript. No React. No side effects.
========================================================= */

import type { TripStatus } from "./trip-types";

/* ─── Transições permitidas ────────────────────────────────
   Avanço do fluxo + voltas de planejamento (back) + retorno
   ao planejamento para "alterar percurso" durante a viagem. */

export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  solicitar: ["rota"],
  rota: ["solicitar", "embarque"],
  embarque: ["rota", "categoria"],
  categoria: ["embarque", "buscando"],
  buscando: ["encontrado", "cancelada"],
  encontrado: ["chegando", "cancelada", "buscando"],
  chegando: ["chegou", "cancelada", "buscando"],
  chegou: ["emviagem", "cancelada", "buscando"],
  emviagem: ["parada", "chegada", "cancelada"],
  parada: ["emviagem", "chegada", "cancelada"],
  chegada: ["avaliacao"],
  avaliacao: ["conclusao"],
  conclusao: [],
  cancelada: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return TRIP_TRANSITIONS[from].includes(to);
}

/* ─── Estados terminais ──────────────────────────────────── */

export function isTerminal(status: TripStatus): boolean {
  return status === "conclusao" || status === "cancelada";
}

/* ─── Cancelamento permitido ─────────────────────────────── */

export function isCancellable(status: TripStatus): boolean {
  return (
    status === "buscando" ||
    status === "encontrado" ||
    status === "chegando" ||
    status === "chegou" ||
    status === "emviagem" ||
    status === "parada"
  );
}

/* ─── Pode concluir (rating completo) ────────────────────── */

export function canComplete(status: TripStatus): boolean {
  return status === "avaliacao" || status === "chegada";
}

/* ─── Retorno no planejamento ────────────────────────────── */

export function backStatus(status: TripStatus): TripStatus | null {
  switch (status) {
    case "rota":
      return "solicitar";
    case "embarque":
      return "rota";
    case "categoria":
      return "embarque";
    default:
      return null;
  }
}

/* ─── Rótulo para o estado (uso futuro em histórico) ─────── */

export function tripStatusLabel(status: TripStatus): string {
  switch (status) {
    case "solicitar":
      return "Planejando";
    case "rota":
      return "Montando rota";
    case "embarque":
      return "Confirmando embarque";
    case "categoria":
      return "Escolhendo categoria";
    case "buscando":
      return "Buscando motorista";
    case "encontrado":
      return "Motorista encontrado";
    case "chegando":
      return "Motorista a caminho";
    case "chegou":
      return "Motorista chegou";
    case "emviagem":
      return "Em viagem";
    case "parada":
      return "Em parada";
    case "chegada":
      return "Chegada";
    case "avaliacao":
      return "Avaliando";
    case "conclusao":
      return "Concluída";
    case "cancelada":
      return "Cancelada";
    default:
      return "";
  }
}
