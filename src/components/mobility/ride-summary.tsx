import { cn } from "@/lib/utils";
import type { RideRequest, PriceEstimate, GeoLocation } from "@/lib/mobility/ride-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { formatDistance, formatDuration } from "@/lib/mobility/ride-utils";
import { getCategoryLabel, getCategoryIcon } from "@/lib/mobility/vehicle-utils";
import { MapPin, Navigation, Route } from "lucide-react";

interface RideSummaryProps {
  request: RideRequest;
  estimate: PriceEstimate | null;
  onConfirm?: () => void;
  confirmLabel?: string;
}

export function RideSummary({
  request,
  estimate,
  onConfirm,
  confirmLabel = "Confirmar viagem",
}: RideSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Route className="h-3.5 w-3.5" />
        Resumo da viagem
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col items-center gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success ring-4 ring-success/20" />
            <div className="w-px h-4 bg-border" />
            {request.stops.map((_, i) => (
              <span key={i}>
                <span className="h-2 w-2 rounded-full bg-amber-500 block" />
                {i < request.stops.length - 1 && (
                  <div className="w-px h-4 bg-border block mx-auto" />
                )}
              </span>
            ))}
            <div className="w-px h-4 bg-border" />
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-sm font-medium">{request.origin.label}</div>
              <div className="text-[11px] text-muted-foreground">Origem</div>
            </div>
            {request.stops.map((stop, i) => (
              <div key={i}>
                <div className="text-sm font-medium">{stop.label}</div>
                <div className="text-[11px] text-muted-foreground">Parada {i + 1}</div>
              </div>
            ))}
            <div>
              <div className="text-sm font-medium">{request.destination.label}</div>
              <div className="text-[11px] text-muted-foreground">Destino</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-center">
        <div className="flex-1">
          <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
            Distância
          </div>
          <div className="font-display text-base font-bold mt-0.5">
            {formatDistance(request.distanceMeters)}
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex-1">
          <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
            Tempo
          </div>
          <div className="font-display text-base font-bold mt-0.5">
            {formatDuration(request.durationMinutes)}
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex-1">
          <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
            Categoria
          </div>
          <div className="font-display text-base font-bold mt-0.5 flex items-center justify-center gap-1">
            {getCategoryIcon(request.category)}
            {getCategoryLabel(request.category)}
          </div>
        </div>
      </div>

      {estimate && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Preço estimado</span>
          <span className="font-display text-lg font-bold text-primary">
            {formatPrice(estimate.finalPrice)}
          </span>
        </div>
      )}

      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full rounded-full bg-gradient-brand py-3.5 text-white font-semibold shadow-elegant"
        >
          {confirmLabel}
        </button>
      )}
    </div>
  );
}
