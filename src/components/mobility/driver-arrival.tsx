import { motion } from "framer-motion";
import type { DriverMatch } from "@/lib/mobility/ride-types";
import { formatEta } from "@/lib/mobility/eta-utils";
import { formatDistance } from "@/lib/mobility/ride-utils";
import { Phone, MessageCircle, Shield } from "lucide-react";

interface DriverArrivalProps {
  driver: DriverMatch;
  etaMinutes: number;
  onCall?: () => void;
  onMessage?: () => void;
  onSOS?: () => void;
}

export function DriverArrival({
  driver,
  etaMinutes,
  onCall,
  onMessage,
  onSOS,
}: DriverArrivalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex items-center gap-3">
        <img src={driver.photo} alt={driver.name} className="h-14 w-14 rounded-full object-cover" />
        <div className="flex-1">
          <div className="font-semibold">{driver.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {driver.vehicle.name} · {driver.vehicle.plate}
          </div>
          <div className="text-[11px] text-primary font-semibold mt-0.5">
            Chega em {formatEta(etaMinutes)} · {formatDistance(driver.distanceMeters)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {onCall && (
          <button
            onClick={onCall}
            className="flex-1 h-11 grid place-items-center rounded-xl bg-secondary gap-1.5"
            aria-label="Ligar para motorista"
          >
            <Phone className="h-4 w-4" />
            <span className="text-[11px] font-medium">Ligar</span>
          </button>
        )}
        {onMessage && (
          <button
            onClick={onMessage}
            className="flex-1 h-11 grid place-items-center rounded-xl bg-secondary gap-1.5"
            aria-label="Enviar mensagem"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[11px] font-medium">Mensagem</span>
          </button>
        )}
        {onSOS && (
          <button
            onClick={onSOS}
            className="h-11 w-11 grid place-items-center rounded-xl bg-destructive/15 text-destructive"
            aria-label="Emergência SOS"
          >
            <Shield className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
