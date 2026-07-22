import { MapPin } from "lucide-react";
import type { ReelLocation as ReelLocationType } from "@/lib/reels/reel-types";
import { formatDistance } from "@/lib/reels/reel-utils";

interface ReelLocationProps {
  location: ReelLocationType;
}

export function ReelLocation({ location }: ReelLocationProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/55 backdrop-blur-md px-3 py-2 border border-white/10">
      <span className="h-7 w-7 grid place-items-center rounded-full bg-gradient-brand text-white shrink-0">
        <MapPin className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">{location.name}</div>
        <div className="text-[10px] text-white/70">{formatDistance(location.distanceMeters)}</div>
      </div>
    </div>
  );
}
