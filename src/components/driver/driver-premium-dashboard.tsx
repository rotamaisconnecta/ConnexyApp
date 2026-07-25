/* ==== driver-premium-dashboard.tsx -- Premium driver dashboard with all stats ==== */

import { motion } from "framer-motion";
import {
  DollarSign,
  Route,
  Star,
  Clock,
  TrendingUp,
  XCircle,
  CheckCircle,
  Timer,
  Power,
  PowerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriverEarnings } from "@/lib/driver/driver-types";
import { driverSection, earningsCount, cardHover, buttonTap } from "./driver-animations";

/* ==== Props ==== */

interface DriverPremiumDashboardProps {
  earnings: DriverEarnings;
  isOnline: boolean;
  onToggleOnline: () => void;
  acceptanceRate?: number;
  onlineMinutes?: number;
  cancelledTrips?: number;
}

/* ==== Stat card ==== */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  index,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      variants={driverSection(index)}
      initial="hidden"
      animate="visible"
      {...cardHover}
      className="rounded-2xl border border-border bg-surface p-3 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] text-muted-foreground">{label}</p>
          <motion.p
            variants={earningsCount}
            initial="hidden"
            animate="visible"
            className="truncate text-sm font-bold text-foreground"
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

/* ==== Main component ==== */

export function DriverPremiumDashboard({
  earnings,
  isOnline,
  onToggleOnline,
  acceptanceRate = 92,
  onlineMinutes = 0,
  cancelledTrips = 3,
}: DriverPremiumDashboardProps) {
  const hours = Math.floor(onlineMinutes / 60);
  const mins = onlineMinutes % 60;
  const onlineTime = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

  const stats = [
    {
      icon: DollarSign,
      label: "Ganhos Hoje",
      value: `R$ ${earnings.today.toFixed(2).replace(".", ",")}`,
      color: "bg-emerald-500",
    },
    {
      icon: DollarSign,
      label: "Ganhos Semana",
      value: `R$ ${earnings.week.toFixed(2).replace(".", ",")}`,
      color: "bg-emerald-600",
    },
    {
      icon: DollarSign,
      label: "Ganhos Mês",
      value: `R$ ${earnings.month.toFixed(2).replace(".", ",")}`,
      color: "bg-emerald-700",
    },
    {
      icon: Route,
      label: "Corridas",
      value: String(earnings.totalTrips),
      color: "bg-blue-500",
    },
    {
      icon: CheckCircle,
      label: "Aceitas",
      value: `${acceptanceRate}%`,
      color: "bg-violet-500",
    },
    {
      icon: XCircle,
      label: "Canceladas",
      value: String(cancelledTrips),
      color: "bg-rose-500",
    },
    {
      icon: Star,
      label: "Avaliação",
      value: "4.9",
      color: "bg-amber-500",
    },
    {
      icon: Timer,
      label: "Tempo Online",
      value: onlineTime,
      color: "bg-indigo-500",
    },
  ];

  return (
    <motion.div
      variants={driverSection(0)}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* Online toggle */}
      <motion.button
        type="button"
        onClick={onToggleOnline}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-soft transition-colors",
          isOnline ? "bg-red-500 text-white" : "bg-gradient-brand text-white",
        )}
      >
        {isOnline ? (
          <>
            <PowerOff className="h-4 w-4" />
            Sair de Operação
          </>
        ) : (
          <>
            <Power className="h-4 w-4" />
            Entrar em Operação
          </>
        )}
      </motion.button>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
