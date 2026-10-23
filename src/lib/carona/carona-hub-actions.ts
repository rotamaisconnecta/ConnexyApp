/* =========================================================
   carona-hub-actions.ts — Dados e copy das ações do Hub da
   Carona Amiga. Separado da rota para poder ser testado sem
   renderizar React.
========================================================= */

import type { CaronaContextSummary } from "@/lib/carona/carona-store";
import {
  caronaDateLabel,
  caronaSeatsLabel,
  caronaTodayIso,
} from "@/lib/carona/carona-format";

export type CaronaHubActionId = "encontrar" | "oferecer" | "minhas";

export type CaronaHubAction = {
  id: CaronaHubActionId;
  title: string;
  description: string;
  cta: string;
  route: string;
};

export const CARONA_HUB_ACTIONS: CaronaHubAction[] = [
  {
    id: "encontrar",
    title: "Encontrar carona",
    description: "Veja pessoas que estão indo para o mesmo lugar.",
    cta: "Encontrar carona",
    route: "/carona/encontrar",
  },
  {
    id: "oferecer",
    title: "Oferecer carona",
    description: "Você vai sair? Ofereça uma vaga no seu trajeto.",
    cta: "Oferecer carona",
    route: "/carona/nova",
  },
  {
    id: "minhas",
    title: "Minhas caronas",
    description: "Acompanhe suas ofertas e pedidos.",
    cta: "Minhas caronas",
    route: "/carona/minhas",
  },
];

/** "2 pessoas estão indo para esse destino" — contagem real, nunca estimada. */
export function caronaDriversLabel(drivers: number): string {
  if (drivers <= 0) return "Ninguém está indo para esse destino ainda";
  if (drivers === 1) return "1 pessoa está indo para esse destino";
  return `${drivers} pessoas estão indo para esse destino`;
}

/** Texto compacto do contexto de Carona Amiga usado fora do Hub. */
export function caronaContextHeadline(summary: CaronaContextSummary): string {
  return caronaDriversLabel(summary.drivers);
}

/** "Hoje • 18:30 • 2 vagas" a partir do contexto real. */
export function caronaContextWhenLabel(
  summary: CaronaContextSummary,
  todayIso: string = caronaTodayIso(),
): string {
  const when = caronaDateLabel(summary.date, todayIso);
  const time = summary.earliestTime;
  const seats = caronaSeatsLabel(summary.seats);
  if (time) return `${when} • ${time} • ${seats}`;
  return `${when} • ${seats}`;
}