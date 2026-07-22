import { cn } from "@/lib/utils";
import type { PriceEstimate } from "@/lib/mobility/ride-types";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import { getSurgeLabel, getSurgeColor } from "@/lib/mobility/ride-pricing";
import { TrendingUp } from "lucide-react";

interface PriceEstimateProps {
  estimate: PriceEstimate;
  compact?: boolean;
}

export function PriceEstimateDisplay({ estimate, compact = false }: PriceEstimateProps) {
  const surgeLabel = getSurgeLabel(estimate.surgeMultiplier);
  const surgeColor = getSurgeColor(estimate.surgeMultiplier);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-sm">{formatPrice(estimate.finalPrice)}</span>
        {surgeLabel && (
          <span className={cn("text-[10px] font-semibold flex items-center gap-0.5", surgeColor)}>
            <TrendingUp className="h-3 w-3" />
            {surgeLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Preço base</span>
        <span className="text-sm">{formatPrice(estimate.basePrice)}</span>
      </div>

      {estimate.discount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-success">Desconto</span>
          <span className="text-sm text-success">-{formatPrice(estimate.discount)}</span>
        </div>
      )}

      {surgeLabel && (
        <div className="flex items-center justify-between">
          <span className={cn("text-sm flex items-center gap-1", surgeColor)}>
            <TrendingUp className="h-3.5 w-3.5" />
            {surgeLabel}
          </span>
          <span className={cn("text-sm font-semibold", surgeColor)}>
            ×{estimate.surgeMultiplier.toFixed(1)}
          </span>
        </div>
      )}

      <div className="border-t border-border pt-2 flex items-center justify-between">
        <span className="font-semibold">Total estimado</span>
        <span className="font-display text-lg font-bold text-primary">
          {formatPrice(estimate.finalPrice)}
        </span>
      </div>
    </div>
  );
}
