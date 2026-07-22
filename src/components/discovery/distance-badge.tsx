import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { distanceLabel, distanceTone } from "@/lib/discovery/distance-utils";

interface DistanceBadgeProps {
  meters: number;
}

export function DistanceBadge({ meters }: DistanceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        distanceTone(meters),
      )}
    >
      <MapPin className="h-3 w-3" />
      {distanceLabel(meters)}
    </span>
  );
}
