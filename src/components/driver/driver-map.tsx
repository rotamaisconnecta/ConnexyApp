import { cn } from "@/lib/utils";
import type { CityHotspot, ActivityLevel } from "@/lib/driver/driver-types";

interface DriverMapProps {
  hotspots: CityHotspot[];
  driverLat?: number;
  driverLng?: number;
}

const levelColors: Record<ActivityLevel, string> = {
  CALMO: "bg-blue-400",
  MODERADO: "bg-amber-400",
  EM_ALTA: "bg-orange-500",
  BOMBANDO: "bg-red-500",
  MUITO_CHEIO: "bg-rose-600",
};

const levelLabels: Record<ActivityLevel, string> = {
  CALMO: "Calmo",
  MODERADO: "Moderado",
  EM_ALTA: "Em Alta",
  BOMBANDO: "Bombando",
  MUITO_CHEIO: "Muito Cheio",
};

function hotspotToPosition(hotspot: CityHotspot): { left: string; top: string } {
  const minLat = -23.15;
  const maxLat = -22.85;
  const minLng = -43.35;
  const maxLng = -43.05;

  const x = ((hotspot.lng - minLng) / (maxLng - minLng)) * 90 + 5;
  const y = ((hotspot.lat - minLat) / (maxLat - minLat)) * 80 + 10;

  return { left: `${x}%`, top: `${y}%` };
}

export function DriverMap({ hotspots, driverLat, driverLng }: DriverMapProps) {
  const driverPos =
    driverLat != null && driverLng != null
      ? {
          left: `${((driverLng - -43.35) / (-43.05 - -43.35)) * 90 + 5}%`,
          top: `${((driverLat - -23.15) / (-22.85 - -23.15)) * 80 + 10}%`,
        }
      : null;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="relative h-56 w-full bg-gradient-to-br from-slate-100 to-slate-200">
        <svg
          className="absolute inset-0 h-full w-full opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50 Q25 30 50 50 T100 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
          />
          <path
            d="M0 70 Q30 50 60 70 T100 70"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
          />
          <path
            d="M20 0 Q20 25 50 30 T80 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
          />
        </svg>

        {hotspots.map((hotspot) => {
          const pos = hotspotToPosition(hotspot);
          return (
            <div
              key={hotspot.id}
              className="absolute group"
              style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
            >
              <div
                className={cn(
                  "h-3.5 w-3.5 rounded-full border-2 border-white shadow-md animate-pulse",
                  levelColors[hotspot.level],
                )}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
                <div className="rounded-lg bg-foreground text-white text-[10px] px-2 py-1 whitespace-nowrap shadow-lg">
                  {hotspot.name}
                </div>
              </div>
            </div>
          );
        })}

        {driverPos && (
          <div
            className="absolute z-10"
            style={{ left: driverPos.left, top: driverPos.top, transform: "translate(-50%, -50%)" }}
          >
            <div className="relative">
              <div className="absolute inset-0 h-6 w-6 -translate-x-1 -translate-y-1 rounded-full bg-primary/20 animate-ping" />
              <div className="relative h-4 w-4 rounded-full bg-primary border-2 border-white shadow-lg" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        {(Object.keys(levelColors) as ActivityLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className={cn("h-2.5 w-2.5 rounded-full", levelColors[level])} />
            <span className="text-[10px] text-muted-foreground">{levelLabels[level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
