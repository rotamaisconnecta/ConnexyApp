import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";

interface ScheduleRideProps {
  scheduledAt: Date | null;
  onSchedule: (date: Date | null) => void;
}

export function ScheduleRide({ scheduledAt, onSchedule }: ScheduleRideProps) {
  const [enabled, setEnabled] = useState(scheduledAt !== null);

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      onSchedule(null);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      onSchedule(tomorrow);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Agendar viagem</span>
        </div>
        <button
          onClick={handleToggle}
          className={cn(
            "h-6 w-11 rounded-full transition relative",
            enabled ? "bg-primary" : "bg-border",
          )}
          aria-label={enabled ? "Desagendar" : "Agendar"}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
              enabled ? "left-5" : "left-0.5",
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm">
            {scheduledAt
              ? scheduledAt.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Selecionar data e hora"}
          </span>
        </div>
      )}
    </div>
  );
}
