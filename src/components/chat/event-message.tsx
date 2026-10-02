import { CalendarDays, MapPin } from "lucide-react";
import { toast } from "sonner";

interface EventMessageProps {
  title: string;
  cover?: string;
  dateText?: string;
  location?: string;
  onView?: () => void;
}

export function EventMessage({ title, cover, dateText, location, onView }: EventMessageProps) {
  return (
    <article className="min-w-0 w-full overflow-hidden rounded-[26px] bg-white shadow-[0_12px_28px_rgba(24,24,43,0.06)]">
      {cover ? (
        <div className="relative aspect-[16/10]">
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {dateText ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-soft">
              <CalendarDays className="h-3 w-3 text-primary" />
              {dateText}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 px-3.5 py-3">
        {!cover && dateText ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-foreground">
            <CalendarDays className="h-3 w-3 text-primary" />
            {dateText}
          </span>
        ) : null}
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight">{title}</h3>
        {location ? (
          <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{location}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (onView) {
              onView();
              return;
            }
            toast.success(`Você será notificado sobre "${title}"`);
          }}
          className="inline-flex h-8 items-center rounded-full bg-primary/10 px-3 text-[12px] font-semibold text-primary transition-transform hover:bg-primary/15 active:scale-[0.97]"
          aria-label={`Ver evento: ${title}`}
        >
          Ver evento
        </button>
      </div>
    </article>
  );
}
