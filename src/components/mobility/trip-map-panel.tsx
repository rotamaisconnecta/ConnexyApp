import { MapCanvas } from "@/components/map-canvas";
import type { GeoLocation, DriverMatch } from "@/lib/mobility/ride-types";

interface TripMapPanelProps {
  origin: GeoLocation;
  destination: GeoLocation;
  driverLocation?: GeoLocation;
  driver?: DriverMatch;
  height?: number;
}

export function TripMapPanel({
  origin,
  destination,
  driverLocation,
  driver,
  height = 280,
}: TripMapPanelProps) {
  const pins = [
    { x: 15, y: 88, kind: "user" as const, label: "Você" },
    ...(driver
      ? [{ x: 30, y: 70, kind: "driver" as const, label: `Chega em ${driver.etaMinutes} min` }]
      : []),
    { x: 85, y: 15, kind: "place" as const, label: destination.label },
  ];

  return (
    <div className="relative">
      <MapCanvas height={height} route pins={pins} />
    </div>
  );
}
