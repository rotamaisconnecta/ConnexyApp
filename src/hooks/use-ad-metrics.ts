/* =========================================================
   use-ad-metrics.ts — Wiring React para métricas locais de
   anúncios. Impressões só são atribuídas quando o card do
   anúncio efetivamente entra na viewport (IntersectionObserver).
   Se o observador não existir no ambiente (ex.: SSR), a impressão
   NÃO é registrada — evitamos declarar visibilidade não comprovada.
   Dedup por exposição: uma mesma montagem conta uma única vez;
   remontagem após navegação é nova exposição legítima.
========================================================= */

import { useEffect, useRef, useState } from "react";
import {
  buildExposureKey,
  createExposureRecorder,
  recordAdMetric,
} from "@/lib/ads/ad-metrics";

let mountCounter = 0;

/** Token de montagem do componente (novo a cada ciclo de exposição). */
export function nextMountId(): string {
  mountCounter = (mountCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `mount-${mountCounter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export type AdImpressionTarget = {
  ad: string;
  placement: string;
  campaignId?: string | null;
  advertiserId?: string | null;
};

/**
 * Marca um evento de impressão quando o anúncio fica visível.
 * Retorna o callback para fixar no DOM do card (element/ref callback).
 */
export function useAdImpression(
  target: AdImpressionTarget,
): (node: HTMLElement | null) => void {
  const mountIdByRef = useRef<string | null>(null);
  const recorderRef = useRef<ReturnType<typeof createExposureRecorder> | null>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!target.ad || !target.placement) return;
    if (mountIdByRef.current === null) mountIdByRef.current = nextMountId();
    if (recorderRef.current === null) recorderRef.current = createExposureRecorder();
    const exposureKey = buildExposureKey(target.placement, target.ad, mountIdByRef.current);
    if (node === null) return; // sem nó no DOM: não há visibilidade a comprovar
    if (typeof IntersectionObserver === "undefined") return; // não declarar visibilidade inventada

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Dedup por montagem: reentrada na mesma exposição não conta 2x.
            if (!recorderRef.current!.recordOnce(exposureKey)) return;
            recordAdMetric({
              type: "impression",
              ad: target.ad,
              placement: target.placement,
              campaignId: target.campaignId,
              advertiserId: target.advertiserId,
            });
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, target.ad, target.placement, target.campaignId, target.advertiserId]);

  return setNode;
}