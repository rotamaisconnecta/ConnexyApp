import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BusinessEvent } from "@/lib/marketplace/business-types";
import { EventCard } from "./event-card";
import { DayOfWeek, type DayOfWeekValue } from "@/lib/marketplace/business-types";

interface EventCalendarProps {
  events: BusinessEvent[];
  onSelect?: (id: string) => void;
}

const WEEK_DAYS: { value: DayOfWeekValue; short: string }[] = [
  { value: DayOfWeek.MON, short: "Seg" },
  { value: DayOfWeek.TUE, short: "Ter" },
  { value: DayOfWeek.WED, short: "Qua" },
  { value: DayOfWeek.THU, short: "Qui" },
  { value: DayOfWeek.FRI, short: "Sex" },
  { value: DayOfWeek.SAT, short: "Sáb" },
  { value: DayOfWeek.SUN, short: "Dom" },
];

export function EventCalendar({ events, onSelect }: EventCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeekValue | null>(null);

  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + 1);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsOnDay = useMemo(() => {
    if (!selectedDay) return events;
    const dayIndex = WEEK_DAYS.findIndex((d) => d.value === selectedDay);
    const targetDate = weekDates[dayIndex];
    if (!targetDate) return events;
    return events.filter((e) => {
      const eventDate = new Date(e.startDate);
      return eventDate.toDateString() === targetDate.toDateString();
    });
  }, [events, selectedDay, weekDates]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Calendário</h3>
        <div className="flex gap-1">
          <button
            aria-label="Semana anterior"
            className="h-7 w-7 grid place-items-center rounded-full bg-secondary"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Próxima semana"
            className="h-7 w-7 grid place-items-center rounded-full bg-secondary"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {WEEK_DAYS.map((day, i) => {
          const date = weekDates[i];
          const isToday = date?.toDateString() === today.toDateString();
          const isSelected = selectedDay === day.value;
          return (
            <button
              key={day.value}
              onClick={() => setSelectedDay(isSelected ? null : day.value)}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              <div className="text-[9px] font-medium">{day.short}</div>
              <div className="text-xs font-semibold">{date?.getDate()}</div>
            </button>
          );
        })}
      </div>

      {eventsOnDay.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento neste dia</p>
      ) : (
        <div className="space-y-3">
          {eventsOnDay.map((event) => (
            <EventCard key={event.id} event={event} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
