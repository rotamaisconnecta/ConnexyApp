import { MapPin } from "lucide-react";

interface LocationMessageProps {
  label: string;
  proximity: string;
  cover?: string;
  lat?: number;
  lng?: number;
  onView?: () => void;
}

export function LocationMessage({ label, proximity, cover, lat, lng, onView }: LocationMessageProps) {
  const canOpenMap = Boolean(onView || (lat != null && lng != null));
  return (
    <article className="min-w-0 w-full overflow-hidden rounded-[26px] bg-white shadow-[0_12px_28px_rgba(24,24,43,0.06)]">
      {cover ? (
        <div className="relative aspect-[16/10]">
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      ) : (
        <div className="grid h-28 place-items-center bg-primary/5">
          <MapPin className="h-8 w-8 text-primary/40" />
        </div>
      )}
      <div className="space-y-2 px-3.5 py-3">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight">{label}</h3>
        <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{proximity}</span>
        </p>
        {canOpenMap ? (
          <button
            type="button"
            onClick={() => {
              if (onView) {
                onView();
                return;
              }
              if (lat != null && lng != null) {
                window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank", "noopener,noreferrer");
              }
            }}
            className="inline-flex h-8 items-center rounded-full bg-primary/10 px-3 text-[12px] font-semibold text-primary transition-transform hover:bg-primary/15 active:scale-[0.97]"
            aria-label={`Ver ${label} no mapa`}
          >
            Ver no mapa
          </button>
        ) : null}
      </div>
    </article>
  );
}
