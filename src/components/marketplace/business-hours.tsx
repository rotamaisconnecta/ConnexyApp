import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessHoursSlot, DayOfWeekValue } from "@/lib/marketplace/business-types";
import { DayOfWeek } from "@/lib/marketplace/business-types";

const DAY_LABELS: Record<DayOfWeekValue, string> = {
  [DayOfWeek.MON]: "Segunda",
  [DayOfWeek.TUE]: "Terça",
  [DayOfWeek.WED]: "Quarta",
  [DayOfWeek.THU]: "Quinta",
  [DayOfWeek.FRI]: "Sexta",
  [DayOfWeek.SAT]: "Sábado",
  [DayOfWeek.SUN]: "Domingo",
};

const DAY_ORDER: DayOfWeekValue[] = [
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
  DayOfWeek.SUN,
];

interface BusinessHoursProps {
  hours: BusinessHoursSlot[];
  isOpen: boolean;
}

export function BusinessHours({ hours, isOpen }: BusinessHoursProps) {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const todayDay = DAY_ORDER[todayIndex];

  function getSlot(day: DayOfWeekValue): BusinessHoursSlot | undefined {
    return hours.find((h) => h.day === day);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">Horário de funcionamento</h3>
        <div className={cn("h-2 w-2 rounded-full", isOpen ? "bg-success" : "bg-error")} />
      </div>

      <div className="space-y-1">
        {DAY_ORDER.map((day) => {
          const slot = getSlot(day);
          const isToday = day === todayDay;

          return (
            <div
              key={day}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs",
                isToday && "bg-primary/10",
              )}
            >
              <span
                className={cn("font-medium", isToday ? "text-primary" : "text-muted-foreground")}
              >
                {DAY_LABELS[day]}
                {isToday && " (hoje)"}
              </span>
              {slot?.closed ? (
                <span className="text-muted-foreground">Fechado</span>
              ) : slot ? (
                <span className="font-medium">
                  {slot.open} - {slot.close}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
