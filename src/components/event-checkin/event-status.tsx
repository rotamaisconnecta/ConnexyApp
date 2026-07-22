import { cn } from "@/lib/utils";

interface EventStatusProps {
  isActive: boolean;
  startTime: Date;
  endTime: Date;
  attendeeCount: number;
}

type StatusState = "live" | "ended" | "upcoming";

function getStatus(isActive: boolean, startTime: Date, endTime: Date): StatusState {
  if (isActive) return "live";
  if (new Date() > endTime) return "ended";
  if (new Date() < startTime) return "upcoming";
  return "ended";
}

const STATUS_CONFIG: Record<
  StatusState,
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  live: {
    label: "Acontecendo agora",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  ended: {
    label: "Encerrado",
    dotColor: "bg-gray-400",
    textColor: "text-gray-500",
    bgColor: "bg-gray-50",
  },
  upcoming: {
    label: "Em breve",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
  },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function EventStatus({ isActive, startTime, endTime, attendeeCount }: EventStatusProps) {
  const state = getStatus(isActive, startTime, endTime);
  const config = STATUS_CONFIG[state];

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface px-4 py-3 shadow-soft">
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", config.dotColor)} />
        <span className={cn("text-sm font-semibold", config.textColor)}>{config.label}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <span className="text-xs text-muted-foreground">
        {formatTime(startTime)} — {formatTime(endTime)}
      </span>

      <div className="ml-auto">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            config.bgColor,
            config.textColor,
          )}
        >
          {attendeeCount} {attendeeCount === 1 ? "pessoa" : "pessoas"}
        </span>
      </div>
    </div>
  );
}
