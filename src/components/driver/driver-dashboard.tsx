import { DollarSign, Route, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { DriverEarnings } from "@/lib/driver/driver-types";
import { OnlineSwitch } from "./online-switch";

interface DriverDashboardProps {
  earnings: DriverEarnings;
  isOnline: boolean;
  onToggleOnline: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
    >
      <div
        className="h-9 w-9 rounded-xl grid place-items-center mb-3"
        style={{ backgroundColor: accent ?? "var(--color-primary-light, #F4F1FF)" }}
      >
        {icon}
      </div>
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      <p className="font-display font-bold text-lg text-foreground">{value}</p>
    </motion.div>
  );
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function DriverDashboard({ earnings, isOnline, onToggleOnline }: DriverDashboardProps) {
  const stats: StatCardProps[] = [
    {
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      label: "Ganhos Hoje",
      value: formatCurrency(earnings.today),
      accent: "rgba(16,185,129,0.1)",
    },
    {
      icon: <Route className="h-4 w-4 text-blue-600" />,
      label: "Corridas",
      value: String(earnings.totalTrips),
      accent: "rgba(59,130,246,0.1)",
    },
    {
      icon: <Star className="h-4 w-4 text-amber-500" />,
      label: "Avaliação",
      value: earnings.averagePerTrip.toFixed(1),
      accent: "rgba(245,158,11,0.1)",
    },
    {
      icon: <Clock className="h-4 w-4 text-violet-600" />,
      label: "Horas Online",
      value: `${earnings.commission.toFixed(0)}h`,
      accent: "rgba(139,92,246,0.1)",
    },
  ];

  return (
    <div className="space-y-4 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </motion.div>

      <div className="flex justify-center pt-1">
        <OnlineSwitch isOnline={isOnline} onToggle={onToggleOnline} />
      </div>
    </div>
  );
}
