import { CalendarDays, MapPin, X } from "lucide-react";
import type { ShareableCheckinItem } from "@/lib/chat/shareable-checkins";

export function CheckinShareSheet({
  open,
  items,
  onClose,
  onShare,
}: {
  open: boolean;
  items: ShareableCheckinItem[];
  onClose: () => void;
  onShare: (item: ShareableCheckinItem) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[70] flex items-end bg-[#3B2A78]/18 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="checkin-share-title"
        aria-modal="true"
        className="flex max-h-[82%] w-full flex-col overflow-hidden rounded-t-[32px] bg-white shadow-[0_-18px_40px_rgba(108,59,255,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-primary/15" />
        </div>
        <div className="flex items-start justify-between px-4 pb-2 pt-3">
          <div>
            <h2 id="checkin-share-title" className="text-sm font-semibold">
              Evento ou local
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Só o que você visitou com check-in.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-5">
          {items.length === 0 ? (
            <div className="rounded-[22px] bg-primary/[0.05] px-4 py-8 text-center">
              <p className="text-sm font-semibold">Nada para compartilhar ainda</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Faça check-in em um evento ou local para ele aparecer aqui.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={`${item.kind}-${item.id}`}
                className="overflow-hidden rounded-[22px] border border-border/50 bg-surface shadow-soft"
              >
                {item.cover ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <img src={item.cover} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-soft">
                      {item.kind === "event" ? "Evento" : "Local"}
                    </span>
                  </div>
                ) : (
                  <div className="grid h-24 place-items-center bg-primary/[0.06]">
                    <MapPin className="h-6 w-6 text-primary/50" />
                  </div>
                )}
                <div className="space-y-1.5 px-3.5 py-3.5">
                  <h3 className="font-display text-[15px] font-semibold leading-snug">{item.title}</h3>
                  {item.location ? (
                    <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{item.location}</span>
                    </p>
                  ) : null}
                  {item.dateText ? (
                    <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{item.dateText}</span>
                    </p>
                  ) : null}
                  <p className="text-[11px] font-medium text-primary">{item.proximity}</p>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onShare(item)}
                      className="inline-flex h-10 min-w-[8.5rem] items-center justify-center rounded-full bg-primary px-4 text-[12px] font-semibold text-white"
                    >
                      Compartilhar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
