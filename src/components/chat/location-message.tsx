import { MapPin } from "lucide-react";

interface LocationMessageProps {
  label: string;
  proximity: string;
  cover?: string;
  onView?: () => void;
}

export function LocationMessage({ label, proximity, cover, onView }: LocationMessageProps) {
  return (
    <div className="rounded-2xl overflow-hidden min-w-[200px]">
      {cover ? (
        <div className="relative h-28">
          <img src={cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ) : (
        <div className="h-28 bg-accent grid place-items-center">
          <MapPin className="h-8 w-8 text-primary/40" />
        </div>
      )}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{label}</p>
            <p className="text-[10px] text-muted-foreground">{proximity}</p>
          </div>
        </div>
        {onView && (
          <button
            type="button"
            onClick={onView}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-95"
            aria-label={`Ver ${label} no mapa`}
          >
            Ver no mapa
          </button>
        )}
      </div>
    </div>
  );
}
