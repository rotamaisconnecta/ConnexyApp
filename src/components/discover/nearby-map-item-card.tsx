import { cn } from "@/lib/utils";
import { TypeScale } from "@/theme/typography";

export type NearbyMapItemVisual = {
  id: string;
  name: string;
  type: "todos" | "pessoas" | "eventos" | "negocios" | "locais";
  distanceLabel: string;
  photo?: string;
  icon: string;
  color: string;
  subtitle: string;
  description?: string;
  hours?: string;
  interestPercent?: number;
  compatibilityPercent?: number;
};

function formatNearbyWhen(value?: string): string | undefined {
  if (!value) return undefined;
  if (/hoje|amanhã|amanha|aberto|horário|horario/i.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface NearbyMapItemCardProps {
  item: NearbyMapItemVisual;
  onSelect: () => void;
}

export function NearbyMapItemCard({ item, onSelect }: NearbyMapItemCardProps) {
  const when = formatNearbyWhen(item.hours);
  const metaParts = [item.distanceLabel, when].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl flex items-center justify-center text-lg",
            item.color,
          )}
        >
          {item.photo ? (
            <img src={item.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{item.icon}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold leading-snug ${TypeScale.cardTitle}`}>{item.name}</p>
          {item.description ? (
            <p className={`mt-0.5 leading-snug text-muted-foreground ${TypeScale.caption}`}>
              {item.description}
            </p>
          ) : item.subtitle ? (
            <p className={`mt-0.5 leading-snug text-muted-foreground ${TypeScale.caption}`}>
              {item.subtitle}
            </p>
          ) : null}
          {item.description && item.subtitle && item.subtitle !== item.description ? (
            <p className={`mt-0.5 leading-snug text-muted-foreground ${TypeScale.meta}`}>
              {item.subtitle}
            </p>
          ) : null}
          {metaParts.length > 0 ? (
            <p className={`mt-1 leading-snug text-muted-foreground ${TypeScale.meta}`}>
              {metaParts.join(" · ")}
            </p>
          ) : null}
          {item.type === "pessoas" &&
            (item.interestPercent != null || item.compatibilityPercent != null) && (
              <div className={`mt-1 flex flex-wrap gap-x-3 text-muted-foreground ${TypeScale.meta}`}>
                {item.interestPercent != null && <span>Interesses: {item.interestPercent}%</span>}
                {item.compatibilityPercent != null && (
                  <span className="font-semibold text-primary">
                    Compatibilidade {item.compatibilityPercent}%
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </button>
  );
}
