import { MapCanvas } from "@/components/map-canvas";
import { cn } from "@/lib/utils";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { RouteStop } from "@/lib/mobility/route-utils";
import { formatDistance, formatDuration } from "@/lib/mobility/ride-utils";
import { MapPin, Route, Clock } from "lucide-react";

interface RoutePreviewProps {
  origin: GeoLocation;
  destination: GeoLocation;
  stops?: RouteStop[];
  distanceMeters: number;
  durationMinutes: number;
  showMap?: boolean;
}

export function RoutePreview({
  origin,
  destination,
  stops = [],
  distanceMeters,
  durationMinutes,
  showMap = true,
}: RoutePreviewProps) {
  const pins = [
    { x: 15, y: 88, kind: "user" as const, label: "Você" },
    ...stops.map((s, i) => ({
      x: 30 + i * 10,
      y: 50 + i * 5,
      kind: "place" as const,
      label: s.label,
    })),
    { x: 85, y: 15, kind: "place" as const, label: destination.label },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {showMap && <MapCanvas height={160} route pins={pins} />}

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Route className="h-3.5 w-3.5" />
            {formatDistance(distanceMeters)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(durationMinutes)}
          </div>
          {stops.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {stops.length} parada{stops.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            {origin.label}
          </span>
          <span>→</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-primary" />
            {destination.label}
          </span>
        </div>
      </div>
    </div>
  );
}
