import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionFade } from "@/components/profile/animations";
import { type MomentData, getMomentStatus } from "@/lib/profile/moment-expiry";

/* ─── Types ──────────────────────────────────────────────── */

export type MomentVariant = "full" | "compact";

export interface MomentProps {
  moment: MomentData;
  variant?: MomentVariant;
  profileName: string;
  onPlaceClick?: (placeName: string) => void;
}

/* ─── Status badge config ────────────────────────────────── */

const STATUS_BADGE: Record<string, { label: string; className: string; dotClass: string }> = {
  active: {
    label: "AGORA",
    className: "bg-success/15 text-success border-success/30",
    dotClass: "bg-success",
  },
  recent: {
    label: "Novo",
    className: "bg-success/15 text-success border-success/30",
    dotClass: "bg-success",
  },
  expiring: {
    label: "",
    className: "bg-warning/15 text-warning border-warning/30",
    dotClass: "bg-warning",
  },
  expired: {
    label: "Expirado",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  ended: {
    label: "Encerrado",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

/* ─── Component ──────────────────────────────────────────── */

export function Moment({ moment, variant = "full", profileName, onPlaceClick }: MomentProps) {
  const { status, label } = getMomentStatus(moment);
  const badge = STATUS_BADGE[status];
  const isCompact = variant === "compact";

  const displayLabel = status === "expiring" ? label : badge.label;

  return (
    <motion.article
      variants={sectionFade(1)}
      initial="hidden"
      animate="visible"
      className={cn(
        "rounded-3xl border bg-surface shadow-soft",
        status === "expired" || status === "ended"
          ? "border-border opacity-60"
          : "border-success/30",
        isCompact ? "p-3" : "p-4",
      )}
      aria-label={`Momento de ${profileName}: ${moment.text}`}
    >
      {/* ── Status badge ──────────────────────────────────── */}

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            badge.className,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", badge.dotClass)} />
          {displayLabel}
        </span>

        {moment.place?.name && !isCompact && (
          <button
            type="button"
            onClick={() => onPlaceClick?.(moment.place!.name)}
            className={cn(
              "ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground",
              onPlaceClick && "cursor-pointer hover:text-foreground transition-colors",
            )}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[140px]">{moment.place.name}</span>
          </button>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────── */}

      <p className={cn("font-medium leading-snug", isCompact ? "mt-2 text-sm" : "mt-3 text-sm")}>
        {moment.text}
      </p>

      {moment.place?.name && isCompact && (
        <button
          type="button"
          onClick={() => onPlaceClick?.(moment.place!.name)}
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground",
            onPlaceClick && "cursor-pointer hover:text-foreground transition-colors",
          )}
        >
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{moment.place.name}</span>
        </button>
      )}
    </motion.article>
  );
}
