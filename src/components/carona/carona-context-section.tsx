/* =========================================================
   carona-context-section.ts — Bloco discreto de Carona
   Amiga para telas de contexto (evento, local, negócio).

   Regras: só aparece quando existe uma oferta real e
   relevante para aquele destino; nunca é obrigatório, nunca
   abre modal e nunca transforma o contexto em origem.
========================================================= */

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CarFront } from "lucide-react";
import {
  caronaContextForDestination,
  subscribeCarona,
} from "@/lib/carona/carona-store";
import { buildCaronaSearch } from "@/lib/carona/carona-search-params";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import {
  caronaContextWhenLabel,
  caronaDriversLabel,
} from "@/lib/carona/carona-hub-actions";

/** Rótulo curto da pergunta contextual, por tipo de origem. */
const QUESTION: Record<string, string> = {
  event: "Vai para este evento?",
  local: "Vai para este lugar?",
  business: "Vai para este lugar?",
};

export function CaronaContextSection({
  destination,
  contextType,
  contextId,
  title,
  question,
}: {
  destination: string | null | undefined;
  contextType: "event" | "local" | "business";
  contextId?: string | null;
  title?: string;
  question?: string;
}) {
  const viewerId = getDemoIdentity().id;
  const [, setTick] = useState(0);
  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);

  const summary = caronaContextForDestination(destination, viewerId);
  if (!summary) return null;

  const heading = question ?? QUESTION[contextType] ?? "Vai para lá?";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
      className="rounded-[26px] border border-border/70 bg-surface/70 px-4 py-4"
    >
      <p className="flex items-center gap-2 font-display text-[15px] font-bold tracking-tight text-foreground">
        <CarFront className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
        {title ?? "Carona Amiga"}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
        {heading} {caronaDriversLabel(summary.drivers).toLowerCase()}.
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {caronaContextWhenLabel(summary)}
      </p>
      <Link
        to="/carona/encontradas"
        search={buildCaronaSearch({
          destination,
          contextType,
          contextId,
          contextLabel: destination ?? undefined,
        })}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary"
      >
        Ver caronas
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
      </Link>
    </motion.section>
  );
}