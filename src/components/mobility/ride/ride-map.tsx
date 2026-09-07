import { motion } from "framer-motion";
import { Car as CarIcon } from "lucide-react";
import { MapCanvas } from "@/components/map-canvas";
import type { RouteStop } from "@/lib/mobility/route-utils";
import { RIDE_LILAC, RIDE_PURPLE } from "./ride-sheet";

/* Plano virtual do mock map (respeita o viewBox 400x300 do
   MapCanvas). Os pontos convertidos em % para overlays. */

export type MapPoint = { x: number; y: number };

const ORIGIN_PT: MapPoint = { x: 56, y: 252 };
const DEST_PT: MapPoint = { x: 302, y: 44 };
const APPROACH_PATH: MapPoint[] = [
  { x: 14, y: 182 },
  { x: 36, y: 224 },
  { x: 52, y: 248 },
];

export function layoutRoutePoints(stops: RouteStop[]): MapPoint[] {
  const stopPoints = stops.map((_, index) => ({
    x: 128 + index * 56,
    y: 218 - index * 62,
  }));
  return [ORIGIN_PT, ...stopPoints, DEST_PT];
}

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

const LETTERS = ["A", "B", "C", "D"];

function pinPosition(point: MapPoint) {
  return { left: `${(point.x / 400) * 100}%`, top: `${(point.y / 300) * 100}%` };
}

/* ─── RideMap ────────────────────────────────────────────── */

export function RideMap({
  stops,
  destinationLabel = "Destino",
  originLabel = "Sua localização",
  vehicle,
  radar = false,
  interactive = false,
  pickupFocus = false,
  onMapDragEnd,
  className = "",
}: {
  stops: RouteStop[];
  destinationLabel?: string;
  originLabel?: string;
  vehicle?: { t: number; label?: string; path: "approach" | "main" } | null;
  radar?: boolean;
  interactive?: boolean;
  pickupFocus?: boolean;
  onMapDragEnd?: (dx: number, dy: number) => void;
  className?: string;
}) {
  const mainPoints = layoutRoutePoints(stops);
  const routePath = smoothPath(mainPoints);
  const vehiclePoints = vehicle?.path === "approach" ? APPROACH_PATH : mainPoints;

  const pins = (
    <div className="pointer-events-none absolute inset-0">
      {/* Origin — A */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={pinPosition(ORIGIN_PT)}
      >
        <div className="flex flex-col items-center">
          <span
            className="grid h-[26px] w-[26px] grid-cols-1 place-items-center rounded-full text-[11px] font-black text-white ring-2 ring-white"
            style={{ background: RIDE_LILAC }}
          >
            A
          </span>
          <span className="mt-1 max-w-[140px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
            {originLabel}
          </span>
        </div>
      </motion.div>

      {/* Stops — B/C/D */}
      {stops.map((stop, index) => {
        const point = mainPoints[index + 1];
        const letter = LETTERS[index + 1];
        return (
          <motion.div
            key={stop.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 * index }}
            layout
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={pinPosition(point)}
          >
            <div className="flex flex-col items-center">
              <span
                className="grid h-[24px] w-[24px] grid-cols-1 place-items-center rounded-full bg-white text-[11px] font-black text-[#111111] shadow-sm"
                style={{ border: "1px solid rgba(168,85,247,0.45)" }}
              >
                {letter}
              </span>
              <span className="mt-1 max-w-[130px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                {stop.label}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Destination */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={pinPosition(DEST_PT)}
      >
        <div className="flex flex-col items-center">
          <span
            className="grid h-[24px] w-[24px] grid-cols-1 place-items-center rounded-[7px] ring-2 ring-white"
            style={{ background: RIDE_PURPLE }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-black" aria-hidden />
          </span>
          <span className="mt-1 max-w-[150px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
            {destinationLabel}
          </span>
        </div>
      </motion.div>

      {/* Radar de busca no ponto de origem */}
      {radar && (
        <div className="absolute z-[5]" style={pinPosition(ORIGIN_PT)}>
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

      {/* Veículo mock */}
      {vehicle && (
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
      route
      routePath={routePath}
      routeColor={RIDE_LILAC}
      className="!rounded-none"
    >
      {pins}
    </MapCanvas>
  );

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-label="Mapa da viagem">
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
          {pickupFocus && (
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
    </div>
  );
}

export type RideMapProps = Parameters<typeof RideMap>[0];
