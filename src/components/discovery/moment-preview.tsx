import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoveryMoment } from "@/lib/discovery/discovery-types";

interface MomentPreviewProps {
  moment: DiscoveryMoment;
}

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  recent: "bg-success/15 text-success border-success/30",
  expiring: "bg-warning/15 text-warning border-warning/30",
  expired: "bg-muted text-muted-foreground border-border",
  ended: "bg-muted text-muted-foreground border-border",
};

const DOT_CLASSES: Record<string, string> = {
  active: "bg-success",
  recent: "bg-success",
  expiring: "bg-warning",
  expired: "bg-muted-foreground",
  ended: "bg-muted-foreground",
};

export function MomentPreview({ moment }: MomentPreviewProps) {
  const statusClass = STATUS_CLASSES[moment.status] ?? STATUS_CLASSES.active;
  const dotClass = DOT_CLASSES[moment.status] ?? DOT_CLASSES.active;

  return (
    <div
      className={cn(
        "rounded-2xl border p-2.5 text-xs",
        moment.expired ? "border-border opacity-60" : statusClass,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
        <span className="font-semibold">{moment.statusLabel}</span>
        {!moment.expired && moment.remainingMs > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] opacity-70">
            <Clock className="h-3 w-3" />
            {moment.statusLabel}
          </span>
        )}
      </div>
      <p className="mt-1 text-foreground leading-snug">{moment.text}</p>
      {moment.placeName && (
        <div className="mt-1 flex items-center gap-1 text-[10px] opacity-70">
          <MapPin className="h-3 w-3" />
          {moment.placeName}
        </div>
      )}
    </div>
  );
}
