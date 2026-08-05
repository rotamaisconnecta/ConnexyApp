import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { toast } from "sonner";

interface EventMessageProps {
  title: string;
  cover?: string;
  dateText?: string;
  location?: string;
}

export function EventMessage({ title, cover, dateText, location }: EventMessageProps) {
  return (
    <div className="rounded-2xl overflow-hidden min-w-[220px] border border-border bg-surface">
      {cover ? (
        <div className="relative h-28">
          <img src={cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {dateText && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-soft">
              <CalendarDays className="h-3 w-3 text-primary" />
              {dateText}
            </span>
          )}
        </div>
      ) : (
        <div className="h-24 bg-accent grid place-items-center">
          <Ticket className="h-8 w-8 text-primary/40" />
        </div>
      )}

      <div className="px-3 py-2.5 space-y-1.5">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {location && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{location}</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => toast.success(`Você será notificado sobre "${title}"`)}
          className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-95"
          aria-label={`Ver evento: ${title}`}
        >
          Ver evento
        </button>
      </div>
    </div>
  );
}
