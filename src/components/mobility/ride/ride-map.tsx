import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Building2, CalendarDays, Car as CarIcon, ShoppingBag } from "lucide-react";
import { MapCanvas } from "@/components/map-canvas";
import {
  enrichRoutePath,
  geoBoundsForLocations,
  layoutRideRoute,
  projectLocation,
  unprojectMapPoint,
  type MapPoint,
} from "@/lib/mobility/ride-map-layout";
import {
  layoutRideExplorePins,
  RIDE_EXPLORE_PIN_COLORS,
  type RideExploreKind,
  type RideExplorePin,
} from "@/lib/mobility/ride-explore-pins";
import { rideLocationHasCoordinates } from "@/lib/mobility/ride-request-context";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { RouteStop } from "@/lib/mobility/route-utils";
import { RIDE_LILAC, RIDE_MAGENTA, RIDE_STOP } from "./ride-sheet";

const EXPLORE_PIN_ICONS: Record<RideExploreKind, typeof CarIcon> = {
  motoristas: CarIcon,
  negocios: Building2,
  eventos: CalendarDays,
  locais: ShoppingBag,
};

export type { MapPoint };
export { layoutRoutePoints } from "@/lib/mobility/ride-map-layout";

export function smoothPath(points: MapPoint[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const midPrevX = (prev.x + curr.x) / 2;
    const midPrevY = (prev.y + curr.y) / 2;
    const midNextX = (curr.x + next.x) / 2;
    const midNextY = (curr.y + next.y) / 2;
    d += ` L ${midPrevX} ${midPrevY} Q ${curr.x} ${curr.y} ${midNextX} ${midNextY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function sampleAt(points: MapPoint[], t: number): MapPoint {
  const clamped = Math.max(0, Math.min(1, t));
  let total = 0;
  const segments = points.slice(1).map((point, index) => {
    const start = points[index];
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const length = Math.hypot(dx, dy);
    total += length;
    return { start, dx, dy, length };
  });
  if (total === 0) return points[0];
  let target = total * clamped;
  for (const segment of segments) {
    if (target <= segment.length) {
      const ratio = segment.length === 0 ? 0 : target / segment.length;
      return {
        x: segment.start.x + segment.dx * ratio,
        y: segment.start.y + segment.dy * ratio,
      };
    }
    target -= segment.length;
  }
  return points[points.length - 1];
}

const APPROACH_PATH: MapPoint[] = [
  { x: 14, y: 182 },
  { x: 36, y: 224 },
  { x: 52, y: 248 },
];

function pinPosition(point: MapPoint) {
  return { left: `${(point.x / 400) * 100}%`, top: `${(point.y / 300) * 100}%` };
}

export type RideRouteStatus = "idle" | "calculating" | "ready" | "error";

/* ─── RideMap ────────────────────────────────────────────── */

export function RideMap({
  origin = null,
  destination = null,
  stops,
  destinationLabel = "Destino",
  originLabel = "Sua localização",
  vehicle,
  radar = false,
  interactive = false,
  pickupFocus = false,
  routeStatus = "idle",
  onRetryRoute,
  onMapPointSelect,
  onOriginClick,
  onDestinationClick,
  onStopClick,
  onMapDragEnd,
  exploreMode = false,
  explorePins = [],
  recenterNonce = 0,
  contained = false,
  compactPins = false,
  className = "",
}: {
  origin?: GeoLocation | null;
  destination?: GeoLocation | null;
  stops: RouteStop[];
  destinationLabel?: string;
  originLabel?: string;
  vehicle?: { t: number; label?: string; path: "approach" | "main" } | null;
  radar?: boolean;
  interactive?: boolean;
  pickupFocus?: boolean;
  routeStatus?: RideRouteStatus;
  onRetryRoute?: () => void;
  onMapPointSelect?: (location: GeoLocation) => void;
  onOriginClick?: () => void;
  onDestinationClick?: () => void;
  onStopClick?: (stopId: string) => void;
  onMapDragEnd?: (dx: number, dy: number) => void;
  exploreMode?: boolean;
  explorePins?: RideExplorePin[];
  recenterNonce?: number;
  contained?: boolean;
  compactPins?: boolean;
  className?: string;
}) {
  const layout = layoutRideRoute(origin, destination, stops);
  const exploreLayout = exploreMode ? layoutRideExplorePins(origin, explorePins) : null;
  const drawnPath = enrichRoutePath(layout.path);
  const routePath = smoothPath(drawnPath);
  const vehiclePoints = vehicle?.path === "approach" ? APPROACH_PATH : layout.path;
  const pinInteractive = Boolean(onOriginClick || onDestinationClick || onStopClick);
  const nearbyFleet =
    !exploreMode && explorePins.length > 0
      ? (() => {
          const located = [
            origin,
            ...stops.map((stop) => stop.location),
            destination,
          ].filter((location): location is GeoLocation =>
            Boolean(location && rideLocationHasCoordinates(location)),
          );
          const bounds = geoBoundsForLocations(located);
          if (!bounds) return [];
          return explorePins
            .filter((pin) => rideLocationHasCoordinates(pin.location))
            .map((pin) => ({ ...pin, point: projectLocation(pin.location, bounds) }));
        })()
      : [];

  const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onMapPointSelect) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.("[data-ride-pin]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 400;
    const y = ((event.clientY - rect.top) / rect.height) * 300;
    const located = [
      origin,
      ...stops.map((stop) => stop.location),
      destination,
    ].filter((location): location is GeoLocation => Boolean(location && rideLocationHasCoordinates(location)));
    const bounds =
      geoBoundsForLocations(located) ??
      geoBoundsForLocations(origin && rideLocationHasCoordinates(origin) ? [origin] : []) ?? {
        minLat: -23.58,
        maxLat: -23.53,
        minLng: -46.67,
        maxLng: -46.62,
      };
    const geo = unprojectMapPoint({ x, y }, bounds);
    onMapPointSelect({
      lat: geo.lat,
      lng: geo.lng,
      label: "Local no mapa",
    });
  };

  const pins = (
    <div className="pointer-events-none absolute inset-0">
      {exploreMode && exploreLayout?.user && (
        <motion.div
          key={`user-${recenterNonce}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={pinPosition(exploreLayout.user)}
        >
          {[0, 1].map((ring) => (
            <motion.span
              key={ring}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3B82F6]/15"
              animate={{ width: [18, 56], height: [18, 56], opacity: [0.55, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.9, ease: "easeOut" }}
            />
          ))}
          <span className="relative block h-3.5 w-3.5 rounded-full bg-[#3B82F6] ring-[10px] ring-[#3B82F6]/18 shadow-[0_0_0_2px_white]" />
        </motion.div>
      )}

      {exploreMode &&
        exploreLayout?.pins.map((pin, index) => {
          const Icon = EXPLORE_PIN_ICONS[pin.kind];
          return (
            <motion.div
              key={pin.id}
              initial={{ scale: 0, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.04 * index }}
              className="absolute z-[8] -translate-x-1/2 -translate-y-1/2"
              style={pinPosition(pin.point)}
              aria-label={pin.label}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-[11px] text-white shadow-[0_8px_16px_rgba(17,17,17,0.16)] ring-2 ring-white"
                style={{ background: RIDE_EXPLORE_PIN_COLORS[pin.kind] }}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
            </motion.div>
          );
        })}

      {!exploreMode &&
        nearbyFleet.map((pin, index) => (
          <motion.div
            key={pin.id}
            initial={{ scale: 0, y: -4 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.03 * index }}
            className="absolute z-[7] -translate-x-1/2 -translate-y-1/2"
            style={pinPosition(pin.point)}
            aria-label={pin.label}
          >
            <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-white shadow-[0_8px_16px_rgba(17,17,17,0.12)] ring-1 ring-black/5">
              <CarIcon className="h-3.5 w-3.5 text-zinc-700" strokeWidth={2.2} />
            </span>
          </motion.div>
        ))}

      {!exploreMode && layout.origin && (
        <motion.button
          type="button"
          data-ride-pin="origin"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
            onOriginClick ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={pinPosition(layout.origin)}
          onClick={onOriginClick}
          aria-label={`Origem: ${originLabel}`}
        >
          <div className="flex flex-col items-center">
            <span
              className="grid h-[26px] w-[26px] grid-cols-1 place-items-center rounded-full text-[11px] font-black text-white ring-2 ring-white"
              style={{ background: RIDE_LILAC }}
            >
              A
            </span>
            {!compactPins && (
              <span className="mt-1 max-w-[140px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                {originLabel}
              </span>
            )}
          </div>
        </motion.button>
      )}

      {!exploreMode && layout.stops.map((stop, index) => (
        <motion.button
          type="button"
          data-ride-pin={`stop-${stop.id}`}
          key={stop.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 * index }}
          layout
          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
            onStopClick ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={pinPosition(stop.point)}
          onClick={() => onStopClick?.(stop.id)}
          aria-label={`Parada ${index + 1}: ${stop.label}`}
        >
          <div className="flex flex-col items-center">
            <span
              className="grid h-[24px] w-[24px] grid-cols-1 place-items-center rounded-full bg-white text-[11px] font-black text-[#111111] shadow-sm"
              style={{ border: `2px solid ${RIDE_STOP}` }}
            >
              {index + 1}
            </span>
            {!compactPins && (
              <span className="mt-1 max-w-[130px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                {stop.label}
              </span>
            )}
          </div>
        </motion.button>
      ))}

      {!exploreMode && layout.destination && (
        <motion.button
          type="button"
          data-ride-pin="destination"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
            onDestinationClick ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={pinPosition(layout.destination)}
          onClick={onDestinationClick}
          aria-label={`Destino: ${destinationLabel}`}
        >
          <div className="flex flex-col items-center">
            <span
              className="grid h-[24px] w-[24px] grid-cols-1 place-items-center rounded-[7px] text-[10px] font-black text-white ring-2 ring-white"
              style={{ background: RIDE_MAGENTA }}
            >
              B
            </span>
            {!compactPins && (
              <span className="mt-1 max-w-[150px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                {destinationLabel}
              </span>
            )}
          </div>
        </motion.button>
      )}

      {radar && layout.origin && (
        <div className="absolute z-[5]" style={pinPosition(layout.origin)}>
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.25)",
              }}
              animate={{ width: [18, 70], height: [18, 70], opacity: [0.7, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.8, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {vehicle && vehiclePoints.length > 0 && (
        <motion.div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={pinPosition(sampleAt(vehiclePoints, vehicle.t))}
          animate={{ ...pinPosition(sampleAt(vehiclePoints, vehicle.t)) }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_6px_16px_rgba(0,0,0,0.3)]">
              <CarIcon className="h-3.5 w-3.5 text-[#A855F7]" />
            </span>
            {vehicle.label && (
              <span className="whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold shadow-sm">
                {vehicle.label}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );

  const map = (
    <MapCanvas
      stretch
      route={!exploreMode && drawnPath.length >= 2 && routeStatus !== "error"}
      routePath={routePath}
      routeColor={RIDE_LILAC}
      className={contained ? "!rounded-[24px]" : "!rounded-none"}
    >
      {pins}
    </MapCanvas>
  );

  return (
    <div
      className={`${contained ? "relative h-full w-full" : "absolute inset-0"} overflow-hidden ${className} ${
        onMapPointSelect || pinInteractive ? "cursor-crosshair" : ""
      }`}
      aria-label="Mapa da viagem"
      onClick={onMapPointSelect ? handleBackgroundClick : undefined}
    >
      {interactive ? (
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ left: -36, right: 36, top: -30, bottom: 30 }}
          dragElastic={0.08}
          style={{ touchAction: "none" }}
          onDragEnd={(_, info) => onMapDragEnd?.(info.offset.x, info.offset.y)}
        >
          {map}
          {pickupFocus && layout.origin && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2">
              <div className="mx-auto flex w-fit flex-col items-center">
                <motion.span
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="grid h-[44px] w-[44px] grid-cols-1 place-items-center rounded-full text-[13px] font-black text-white ring-2 ring-white"
                  style={{ background: RIDE_LILAC, boxShadow: "0 0 0 8px rgba(168,85,247,0.2)" }}
                >
                  A
                </motion.span>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        map
      )}

      {routeStatus === "calculating" && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-sm">
          Calculando rota...
        </div>
      )}
      {routeStatus === "error" && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-2xl bg-white/95 px-3 py-3 text-center shadow-sm">
          <p className="text-[12px] font-semibold text-[#111111]">Não foi possível calcular essa rota.</p>
          {onRetryRoute && (
            <button
              type="button"
              onClick={onRetryRoute}
              className="mt-2 text-[12px] font-bold"
              style={{ color: RIDE_LILAC }}
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
      {onMapPointSelect && (
        <p className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm">
          Toque no mapa para escolher o ponto
        </p>
      )}
    </div>
  );
}

export type RideMapProps = Parameters<typeof RideMap>[0];
