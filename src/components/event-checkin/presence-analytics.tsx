import { motion } from "framer-motion";
import { Flame, Clock, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePresence } from "@/providers/presence/presence-provider";
import {
  PlaceStatus,
  PlaceStatusMeta,
  type PlaceStatusValue,
} from "@/lib/integration/integration-types";

interface PresenceAnalyticsProps {
  targetIds: string[];
  title?: string;
}

const STATUS_ORDER: PlaceStatusValue[] = [
  PlaceStatus.MUITO_CHEIO,
  PlaceStatus.BOMBANDO,
  PlaceStatus.MOVIMENTADO,
  PlaceStatus.CALMO,
];

function StatusBadge({ status }: { status: PlaceStatusValue }) {
  const meta = PlaceStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        meta.bg,
        meta.color,
        meta.border,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function PresenceAnalytics({
  targetIds,
  title = "Análises de presença",
}: PresenceAnalyticsProps) {
  const { getMetrics, heatmap } = usePresence();

  const metrics = targetIds.map((id) => getMetrics(id));
  const present = metrics.reduce((sum, m) => sum + m.present, 0);
  const arriving = metrics.reduce((sum, m) => sum + m.arriving, 0);
  const visited = metrics.reduce((sum, m) => sum + m.visited, 0);
  const anonymous = metrics.reduce((sum, m) => sum + m.anonymous, 0);

  const totalStays = metrics.reduce((sum, m) => sum + (m.avgStayMinutes > 0 ? 1 : 0), 0);
  const avgStayMinutes =
    totalStays > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.avgStayMinutes, 0) / totalStays)
      : 0;

  const busiest = metrics.sort((a, b) => b.present - a.present)[0];
  const movement = busiest?.movement ?? PlaceStatus.CALMO;
  const movementRank = STATUS_ORDER.indexOf(movement);
  const peakHour = busiest?.peakHour ?? 0;

  const statCards = [
    { icon: Users, label: "Presentes", value: present, color: "text-primary bg-primary/10" },
    {
      icon: TrendingUp,
      label: "Chegando",
      value: arriving,
      color: "text-emerald-600 bg-emerald-50",
    },
    { icon: Clock, label: "Já estiveram", value: visited, color: "text-amber-600 bg-amber-50" },
    { icon: Flame, label: "Anônimos", value: anonymous, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
        <StatusBadge status={movement} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl border border-border p-3">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", color)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-none">{value}</p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-border p-3">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground">Tempo médio</p>
          <p className="mt-0.5 text-sm font-bold">
            {avgStayMinutes > 0 ? `${avgStayMinutes} min` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground">Pico de visitas</p>
          <p className="mt-0.5 text-sm font-bold">{String(peakHour).padStart(2, "0")}:00</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Flame className="h-3 w-3" /> Mapa de calor
          <span className="ml-auto">🔥 alto · baixo</span>
        </p>
        <div className="grid aspect-square w-full grid-cols-6 gap-1">
          {Array.from({ length: 36 }, (_, index) => {
            const cell = heatmap.find((c) => c.id === `heat-${Math.floor(index / 6)}-${index % 6}`);
            const weight = cell?.weight ?? 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: weight > 0 ? 1 : 0.25, scale: 1 }}
                transition={{ delay: index * 0.008 }}
                className={cn(
                  "rounded-[4px] transition-colors",
                  weight >= 0.66
                    ? "bg-red-500"
                    : weight >= 0.33
                      ? "bg-orange-400"
                      : weight > 0
                        ? "bg-amber-300"
                        : "bg-muted-foreground/10",
                )}
                style={{
                  gridRowStart: Math.floor(index / 6) + 1,
                  gridColumnStart: (index % 6) + 1,
                }}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Movimento agregado — presenças anônimas contam sem revelar identidade
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {metrics.map((m, i) => (
          <span
            key={i}
            className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
          >
            Local {i + 1}: {PlaceStatusMeta[m.movement].label} ({m.present})
          </span>
        ))}
      </div>
    </div>
  );
}
