/* =========================================================
   carona-search-params.ts — Serialização dos critérios da
   busca de Carona Amiga na URL (search params do TanStack
   Router). Sem estado global: a URL é a fonte da verdade.
========================================================= */

import { z } from "zod";

export const caronaSearchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  seats: z.number().optional(),
  contextType: z.string().optional(),
  contextId: z.string().optional(),
  contextLabel: z.string().optional(),
});

export type CaronaSearch = z.infer<typeof caronaSearchSchema>;

function trimOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Só envia o que existe — nada de campos vazios na URL. */
export function buildCaronaSearch(
  criteria: {
    origin?: string | null;
    destination?: string | null;
    date?: string | null;
    time?: string | null;
    seats?: number | null;
    contextType?: string | null;
    contextId?: string | null;
    contextLabel?: string | null;
  },
): CaronaSearch {
  const origin = trimOrNull(criteria.origin);
  const destination = trimOrNull(criteria.destination);
  const date = trimOrNull(criteria.date);
  const time = trimOrNull(criteria.time);
  const seats = criteria.seats == null ? null : Math.max(1, Math.round(criteria.seats));
  return {
    ...(origin ? { origin } : {}),
    ...(destination ? { destination } : {}),
    ...(date ? { date } : {}),
    ...(time ? { time } : {}),
    ...(seats ? { seats } : {}),
    ...(trimOrNull(criteria.contextType) ? { contextType: trimOrNull(criteria.contextType)! } : {}),
    ...(trimOrNull(criteria.contextId) ? { contextId: trimOrNull(criteria.contextId)! } : {}),
    ...(trimOrNull(criteria.contextLabel)
      ? { contextLabel: trimOrNull(criteria.contextLabel)! }
      : {}),
  };
}

/** Só o destino existe: origem continua sendo a do usuário, nunca o evento/local. */
export function caronaSearchHasDestination(search: CaronaSearch): boolean {
  return Boolean(trimOrNull(search.destination));
}