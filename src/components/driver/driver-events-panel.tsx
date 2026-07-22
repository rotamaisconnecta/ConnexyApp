import { motion } from "framer-motion";
import { Navigation } from "lucide-react";
import { getActivityEmoji, getActivityColor } from "@/lib/driver/driver-hotspots";
import type { DriverEvent } from "@/lib/driver/driver-types";

interface DriverEventsPanelProps {
  events: DriverEvent[];
  onNavigate: (eventId: string) => void;
}

export function DriverEventsPanel({ events, onNavigate }: DriverEventsPanelProps) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
        Eventos Próximos
      </div>
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getActivityEmoji(event.level)}</span>
            <div>
              <div className="text-sm font-semibold">{event.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {event.category} · {event.distance}km
              </div>
              <span className={`text-[10px] font-semibold ${getActivityColor(event.level)}`}>
                {event.status}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate(event.id)}
            className="h-8 w-8 grid place-items-center rounded-full bg-primary/10 text-primary"
          >
            <Navigation className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
