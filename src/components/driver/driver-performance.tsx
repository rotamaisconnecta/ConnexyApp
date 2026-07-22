import { motion } from "framer-motion";
import { Star, CheckCircle, TrendingUp } from "lucide-react";

interface DriverPerformanceProps {
  rating: number;
  totalTrips: number;
  completionRate: number;
  acceptanceRate: number;
}

export function DriverPerformance({
  rating,
  totalTrips,
  completionRate,
  acceptanceRate,
}: DriverPerformanceProps) {
  const stats = [
    { label: "Avaliação", value: rating.toFixed(1), icon: Star, suffix: "★" },
    { label: "Total de Corridas", value: String(totalTrips), icon: TrendingUp },
    { label: "Taxa de Conclusão", value: `${completionRate}%`, icon: CheckCircle },
    { label: "Taxa de Aceitação", value: `${acceptanceRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-2xl border border-border bg-surface p-4 shadow-soft text-center"
        >
          <stat.icon className="h-5 w-5 text-primary mx-auto" />
          <div className="text-xl font-bold mt-2">
            {stat.value}
            {stat.suffix && <span className="text-primary text-sm ml-0.5">{stat.suffix}</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
