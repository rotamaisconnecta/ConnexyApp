import { MapPin, Navigation } from "lucide-react";
import { MapCanvas } from "@/components/map-canvas";
import type { GeoLocation } from "@/lib/marketplace/business-types";
import { formatDistance } from "@/lib/marketplace/distance-utils";

interface BusinessMapPreviewProps {
  location: GeoLocation;
  address: string;
  businessName: string;
  distanceMeters: number;
  onDirections?: () => void;
}

export function BusinessMapPreview({
  location,
  address,
  businessName,
  distanceMeters,
  onDirections,
}: BusinessMapPreviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Localização</h3>

      <div className="rounded-2xl overflow-hidden border border-border/50">
        <MapCanvas
          height={160}
          pins={[{ x: 50, y: 50, kind: "place" as const, label: businessName }]}
        />
      </div>

      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium">{address}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatDistance(distanceMeters)} de distância
          </p>
        </div>
      </div>

      {onDirections && (
        <button
          onClick={onDirections}
          className="w-full rounded-full bg-secondary py-2.5 text-xs font-medium flex items-center justify-center gap-1.5"
        >
          <Navigation className="h-3.5 w-3.5" />
          Abrir no mapa
        </button>
      )}
    </div>
  );
}
