import { Plus, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RouteStop } from "@/lib/mobility/route-utils";
import { formatStopsText } from "@/lib/mobility/route-utils";

interface StopManagerProps {
  stops: RouteStop[];
  onAddStop?: () => void;
  onRemoveStop?: (stopId: string) => void;
  maxStops?: number;
}

export function StopManager({ stops, onAddStop, onRemoveStop, maxStops = 3 }: StopManagerProps) {
  const canAdd = stops.length < maxStops;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Paradas
        </p>
        <span className="text-[11px] text-muted-foreground">{formatStopsText(stops)}</span>
      </div>

      {stops.map((stop) => (
        <div
          key={stop.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-amber-500 text-sm">●</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{stop.label}</div>
          </div>
          {onRemoveStop && (
            <button
              onClick={() => onRemoveStop(stop.id)}
              className="h-7 w-7 grid place-items-center rounded-full hover:bg-accent shrink-0"
              aria-label="Remover parada"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}

      {canAdd && onAddStop && (
        <button
          onClick={onAddStop}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar parada
        </button>
      )}
    </div>
  );
}
