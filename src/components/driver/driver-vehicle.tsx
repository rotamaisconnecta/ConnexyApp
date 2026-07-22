import { motion } from "framer-motion";
import type { VehicleInfo } from "@/lib/driver/driver-types";

interface DriverVehicleProps {
  vehicle: VehicleInfo;
}

export function DriverVehicle({ vehicle }: DriverVehicleProps) {
  const info = [
    { label: "Marca", value: vehicle.brand },
    { label: "Modelo", value: vehicle.model },
    { label: "Cor", value: vehicle.color },
    { label: "Ano", value: vehicle.year },
    { label: "Passageiros", value: String(vehicle.passengers) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3"
    >
      <div className="rounded-xl bg-accent px-3 py-2 text-center">
        <div className="text-lg font-bold font-mono tracking-wider">{vehicle.plate}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {info.map((item) => (
          <div key={item.label} className="rounded-xl bg-background px-3 py-2">
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
            <div className="text-sm font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <ToggleBadge label="Pet" active={vehicle.acceptsPet} />
        <ToggleBadge label="Bagagem" active={vehicle.acceptsBaggage} />
        <ToggleBadge label="Ar" active={vehicle.hasAirConditioning} />
      </div>
    </motion.div>
  );
}

function ToggleBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}
