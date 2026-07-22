import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import { createStop, type RouteStop } from "@/lib/mobility/route-utils";

interface RideRequestFormProps {
  origin: GeoLocation | null;
  destination: GeoLocation | null;
  stops: RouteStop[];
  onOriginChange: (location: GeoLocation | null) => void;
  onDestinationChange: (location: GeoLocation | null) => void;
  onAddStop: (location: GeoLocation, label: string) => void;
  onRemoveStop: (stopId: string) => void;
  suggestions?: { id: string; name: string; address: string; distance: string; icon: string }[];
  onSelectSuggestion?: (suggestion: { id: string; name: string; address: string }) => void;
}

export function RideRequestForm({
  origin,
  destination,
  stops,
  onOriginChange,
  onDestinationChange,
  onAddStop,
  onRemoveStop,
  suggestions = [],
  onSelectSuggestion,
}: RideRequestFormProps) {
  const [originText, setOriginText] = useState(origin?.label ?? "Minha localização");
  const [destinationText, setDestinationText] = useState(destination?.label ?? "");

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-success ring-4 ring-success/20 shrink-0" />
        <input
          value={originText}
          onChange={(e) => setOriginText(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm font-medium"
          placeholder="Origem"
        />
        <button
          className="h-8 w-8 grid place-items-center rounded-full bg-secondary shrink-0"
          aria-label="Usar localização atual"
        >
          <Navigation className="h-3.5 w-3.5 text-primary" />
        </button>
      </div>

      {stops.map((stop) => (
        <div key={stop.id} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
          <input
            value={stop.label}
            readOnly
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button
            onClick={() => onRemoveStop(stop.id)}
            className="h-8 w-8 grid place-items-center rounded-full bg-secondary shrink-0 text-xs text-destructive"
            aria-label="Remover parada"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="border-t border-border" />

      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-sm bg-primary shrink-0" />
        <input
          value={destinationText}
          onChange={(e) => setDestinationText(e.target.value)}
          placeholder="Para onde você vai?"
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>

      {suggestions.length > 0 && (
        <ul className="divide-y divide-border">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelectSuggestion?.(s)}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-accent/50 rounded-xl px-1 transition-colors"
              >
                <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-lg shrink-0">
                  {s.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                  {s.distance}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
