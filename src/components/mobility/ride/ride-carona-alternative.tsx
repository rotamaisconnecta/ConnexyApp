/* =========================================================
   ride-carona-alternative.ts — Bloco secundário que
   aparece no fluxo de corrida quando existe uma Carona
   Amiga real para o destino informado.

   Regra dura: a corrida continua sendo o fluxo principal.
   Este bloco nunca altera origem, destino, preço ou
   categoria. Se não houver oferta com vaga, não existe.
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
import {
  caronaContextWhenLabel,
  caronaDriversLabel,
} from "@/lib/carona/carona-hub-actions";
import { getDemoIdentity } from "@/lib/demo/demo-identity";

export function RideCaronaAlternative({
  destinationLabel,
}: {
  /** Já resolvido como texto pelo fluxo de corrida; nunca coordenadas. */
  destinationLabel: string | null | undefined;
}) {
  const viewerId = getDemoIdentity().id;
  const [, setTick] = useState(0);
  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);

  const summary = caronaContextForDestination(destinationLabel, viewerId);
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <section className="rounded-[24px] border border-zinc-200/80 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
        <p className="flex items-center gap-2 text-[13px] font-bold text-[#111111]">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(168,85,247,0.12)" }}
          >
            <CarFront className="h-[15px] w-[15px]" style={{ color: "#A855F7" }} strokeWidth={2.2} />
          </span>
          Talvez você possa ir de Carona Amiga
        </p>
        <p className="mt-1.5 text-[12px] leading-snug text-[#6E6E73]">
          {caronaDriversLabel(summary.drivers)}.
        </p>
        <p className="mt-0.5 text-[12px] text-[#6E6E73]">
          {caronaContextWhenLabel(summary)}
        </p>
        <Link
          to="/carona/encontradas"
          search={buildCaronaSearch({
            destination: destinationLabel,
            contextType: "ride",
            contextLabel: destinationLabel ?? undefined,
          })}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: "#6D28D9" }}
        >
          Ver caronas
          <ArrowRight className="h-[13px] w-[13px]" strokeWidth={2.6} />
        </Link>
      </section>
    </motion.div>
  );
}